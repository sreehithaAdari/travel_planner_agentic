import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn

from db import get_db, Itinerary, Base, engine
from travel_graph import app as graph_app
from travel_state import TravelState

app = FastAPI(title="Travel Planner AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    destination: str
    days: int
    people: int
    adults: int
    children: int
    budget: float
    travel_type: str

class TripResponse(BaseModel):
    id: int
    destination: str
    days: int
    budget: float
    travel_type: str
    budget_sufficient: bool
    estimated_cost: float
    final_itinerary: str

@app.post("/api/v1/planner/generate", response_model=TripResponse)
async def generate_plan(request: TripRequest, db: Session = Depends(get_db)):
    initial_state = {
        "destination": request.destination,
        "days": request.days,
        "people": request.people,
        "adults": request.adults,
        "children": request.children,
        "budget": request.budget,
        "travel_type": request.travel_type
    }
    
    # Run LangGraph workflow
    final_state = graph_app.invoke(initial_state)
    
    # Extract results
    budget_sufficient = final_state.get('budget_sufficient', False)
    estimated_cost = final_state.get('estimated_cost', 0.0)
    final_itinerary = final_state.get('final_itinerary', "")
    
    # Save to SQLite
    new_itinerary = Itinerary(
        destination=request.destination,
        days=request.days,
        people=request.people,
        adults=request.adults,
        children=request.children,
        budget=request.budget,
        travel_type=request.travel_type,
        budget_sufficient=budget_sufficient,
        estimated_cost=estimated_cost,
        final_itinerary=final_itinerary
    )
    
    db.add(new_itinerary)
    db.commit()
    db.refresh(new_itinerary)
    
    return new_itinerary

@app.get("/api/v1/planner/{plan_id}", response_model=TripResponse)
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Itinerary).filter(Itinerary.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@app.get("/api/v1/planner/history")
async def get_history(db: Session = Depends(get_db)):
    plans = db.query(Itinerary).order_by(Itinerary.id.desc()).all()
    # We map it to avoid issues with missing fields
    result = []
    for plan in plans:
        result.append({
            "id": plan.id,
            "destination": plan.destination,
            "days": plan.days,
            "budget": plan.budget,
            "travel_type": plan.travel_type,
            "budget_sufficient": plan.budget_sufficient,
            "estimated_cost": plan.estimated_cost,
            "final_itinerary": plan.final_itinerary
        })
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
