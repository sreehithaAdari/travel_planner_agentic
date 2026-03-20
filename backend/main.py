import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn
import uuid

from db import get_db, Chat, Message, ItineraryData, Base, engine
from travel_graph import app as graph_app, chat_agent
from travel_state import TripRequest

app = FastAPI(title="Travel Planner AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessageRequest(BaseModel):
    message: str

class NewChatResponse(BaseModel):
    chat_id: str
    message: str

@app.post("/api/v1/generate-itinerary")
async def generate_itinerary(request: TripRequest, db: Session = Depends(get_db)):
    initial_state = {
        "destination": request.destination,
        "days": request.days,
        "people": request.people,
        "adults": request.adults,
        "children": request.children,
        "budget": request.budget,
        "currency": request.currency,
        "travel_type": request.travel_type
    }
    
    # Run LangGraph workflow
    final_state = graph_app.invoke(initial_state)
    
    budget_sufficient = final_state.get('budget_sufficient', False)
    estimated_cost = final_state.get('estimated_cost', 0.0)
    final_itinerary = final_state.get('final_itinerary', "")
    
    # Create new Chat
    new_chat_id = str(uuid.uuid4())
    chat_title = f"{request.days}-Day Trip to {request.destination}"
    new_chat = Chat(id=new_chat_id, title=chat_title)
    db.add(new_chat)
    
    # Save Itinerary Data
    itinerary_data = ItineraryData(
        chat_id=new_chat_id,
        destination=request.destination,
        days=request.days,
        people=request.people,
        adults=request.adults,
        children=request.children,
        budget=request.budget,
        currency=request.currency,
        travel_type=request.travel_type,
        budget_sufficient=budget_sufficient,
        estimated_cost=estimated_cost,
        final_itinerary=final_itinerary
    )
    db.add(itinerary_data)
    
    # Add initial system-like message or welcome message to DB
    welcome_msg = Message(
        chat_id=new_chat_id,
        role="ai",
        content=f"Here is your customized itinerary for {request.destination}!\n\n{final_itinerary}"
    )
    db.add(welcome_msg)
    
    db.commit()
    
    return {
        "chat_id": new_chat_id,
        "itinerary": final_itinerary,
        "budget_sufficient": budget_sufficient,
        "estimated_cost": estimated_cost
    }

@app.post("/api/v1/chat/{chat_id}")
async def chat_interaction(chat_id: str, request: ChatMessageRequest, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    itinerary = db.query(ItineraryData).filter(ItineraryData.chat_id == chat_id).first()
    if not itinerary:
        raise HTTPException(status_code=400, detail="No itinerary found for this chat. Generate an itinerary first.")

    # Save user message
    user_msg = Message(chat_id=chat_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()
    
    # Fetch previous messages for context
    db_messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.id.asc()).all()
    message_history = [{"role": msg.role, "content": msg.content} for msg in db_messages]

    # Generate response from LangBridge/Agent
    ai_response_content = chat_agent(
        messages=message_history,
        itinerary=itinerary.final_itinerary,
        destination=itinerary.destination
    )
    
    # Save AI response
    ai_msg = Message(chat_id=chat_id, role="ai", content=ai_response_content)
    db.add(ai_msg)
    db.commit()
    
    return {"response": ai_response_content}

@app.get("/api/v1/chats")
async def get_chats(db: Session = Depends(get_db)):
    chats = db.query(Chat).order_by(Chat.id.desc()).all()
    return [{"id": c.id, "title": c.title} for c in chats]

@app.get("/api/v1/chat/{chat_id}")
async def get_chat_details(chat_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    itinerary = db.query(ItineraryData).filter(ItineraryData.chat_id == chat_id).first()
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.id.asc()).all()
    
    return {
        "id": chat.id,
        "title": chat.title,
        "itinerary_data": {
            "destination": itinerary.destination if itinerary else None,
            "days": itinerary.days if itinerary else None,
            "budget": itinerary.budget if itinerary else None,
            "currency": itinerary.currency if itinerary else None,
            "travel_type": itinerary.travel_type if itinerary else None,
            "final_itinerary": itinerary.final_itinerary if itinerary else None,
            "estimated_cost": itinerary.estimated_cost if itinerary else None,
            "budget_sufficient": itinerary.budget_sufficient if itinerary else None
        } if itinerary else None,
        "messages": [{"role": m.role, "content": m.content} for m in messages]
    }

@app.post("/api/v1/new-chat", response_model=NewChatResponse)
async def create_new_chat(db: Session = Depends(get_db)):
    # Wait, 'new-chat' according to requirements means resetting flow.
    # We don't necessarily need to create it in DB until they generate the itinerary, 
    # but let's just create an empty chat here so we can give them an ID if needed,
    # or just tell them to go to the form.
    # But wait, without itinerary, they can't chat anyway.
    # The requirement says: "New Chat: POST /new-chat".
    new_chat_id = str(uuid.uuid4())
    new_chat = Chat(id=new_chat_id, title="New Trip Configuration")
    db.add(new_chat)
    db.commit()
    return {"chat_id": new_chat_id, "message": "New chat created. Please generate an itinerary."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
