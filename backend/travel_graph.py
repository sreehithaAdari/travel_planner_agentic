import os
from typing import Literal
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from travel_state import TravelState

load_dotenv()

# Initialize LLM with increased timeout and max_retries to prevent ReadTimeout
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    temperature=0.7, 
    timeout=120.0, 
    max_retries=3
)

def user_preference(state: TravelState):
    """Agent 1: Processes user preferences and formats the initial request."""
    return {"current_plan": f"Processing trip to {state['destination']} for {state['days']} days.", "messages": []}

def budget_estimation(state: TravelState):
    """Agent 4: Estimates the budget required for the trip."""
    prompt = f"""
    Estimate the total cost in {state['currency']} for a trip with the following details:
    Destination: {state['destination']}
    Duration: {state['days']} days
    People: {state['people']} ({state['adults']} adults, {state['children']} children)
    Travel Type: {state['travel_type']}
    
    Return ONLY a number representing the estimated cost in {state['currency']}. No symbols or extra text.
    """
    response = llm.invoke(prompt)
    try:
        cost = float(response.content.strip().replace('$', '').replace(',', ''))
    except:
        cost = state['budget'] * 1.2 # fallback
    return {"estimated_cost": cost}

def budget(state: TravelState):
    """Agent 2: Compares estimated cost with user budget."""
    sufficient = state['budget'] >= state['estimated_cost']
    return {"budget_sufficient": sufficient}

def luxury(state: TravelState):
    """Agent 3: Additional checks for luxury travel."""
    if state['travel_type'].lower() == 'luxury':
        # Even if budget is strictly sufficient, luxury might require more buffer
        if state['estimated_cost'] > state['budget'] * 0.9:
            return {"luxury_possible": False, "budget_sufficient": False}
        return {"luxury_possible": True}
    return {"luxury_possible": None}

def budget_sufficient(state: TravelState):
    """Agent 5: Generates the full itinerary when budget is sufficient."""
    prompt = f"""
    Generate a highly structured and detailed {state['travel_type']} itinerary for a {state['days']}-day trip to {state['destination']}.
    Budget: {state['budget']} {state['currency']} (Sufficient for {state['travel_type']})
    Travelers: {state['people']} ({state['adults']} adults, {state['children']} children)
    
    Structure the response clearly:
    
    ## Overview
    Brief overview of the trip.
    
    ## Accommodation
    Suggested places to stay that fit the {state['travel_type']} context.
    
    ## Food & Dining
    Suggested restaurants or food experiences.
    
    ## Day-by-Day Itinerary
    Provide a day-wise plan. If there are children, ensure activities cater to them.
    
    Format nicely in markdown. Do not include introductory or closing remarks outside the requested sections.
    """
    response = llm.invoke(prompt)
    return {"final_itinerary": response.content}

def budget_insufficient(state: TravelState):
    """Agent 6: Analyzes the shortfall and provides reasoning."""
    shortfall = state['estimated_cost'] - state['budget']
    reason = f"Budget is insufficient for {state['travel_type']} travel to {state['destination']}. Estimated: {state['estimated_cost']} {state['currency']}, Provided: {state['budget']} {state['currency']}."
    return {"adjustments_made": reason}

def adjust_plan(state: TravelState):
    """Agent 7: Generates a readjusted itinerary fitting the lower budget."""
    prompt = f"""
    The user requested a {state['travel_type']} trip to {state['destination']} for {state['days']} days, but the budget ({state['budget']} {state['currency']}) is insufficient (Estimated cost was {state['estimated_cost']} {state['currency']}).
    
    Readjust the plan to fit the user's provided budget of {state['budget']} {state['currency']}.
    Travelers: {state['people']} ({state['adults']} adults, {state['children']} children).
    
    Structure the response clearly:
    
    ## Budget Adjustments
    Explanation of how the budget was reduced (e.g., cheaper hotels, budget dining).
    
    ## Accommodation
    Suggested budget-friendly places to stay.
    
    ## Food & Dining
    Suggested cheap eats or self-catering options.
    
    ## Day-by-Day Itinerary
    Provide a day-wise plan with free or low-cost activities. If there are children, ensure activities cater to them.
    
    Format nicely in markdown. Do not include introductory or closing remarks outside the requested sections.
    """
    response = llm.invoke(prompt)
    return {"final_itinerary": response.content}

def route_budget(state: TravelState) -> Literal["agent5", "agent6"]:
    if state.get("budget_sufficient", False):
        return "agent5"
    return "agent6"

# Build Graph
workflow = StateGraph(TravelState)

workflow.add_node("agent1", user_preference)
workflow.add_node("agent4", budget_estimation)
workflow.add_node("agent2", budget)
workflow.add_node("agent3", luxury)
workflow.add_node("agent5", budget_sufficient)
workflow.add_node("agent6", budget_insufficient)
workflow.add_node("agent7", adjust_plan)

# Define edges
workflow.add_edge(START, "agent1")
workflow.add_edge("agent1", "agent4")
workflow.add_edge("agent4", "agent2")
workflow.add_edge("agent2", "agent3")

# Conditional routing after agent3
workflow.add_conditional_edges("agent3", route_budget)

workflow.add_edge("agent5", END)
workflow.add_edge("agent6", "agent7")
workflow.add_edge("agent7", END)

app = workflow.compile()

def chat_agent(messages: list, itinerary: str, destination: str):
    """Handles chat interaction scoped strictly to the itinerary."""
    system_prompt = f"""
    You are an expert travel assistant. The user has planned a trip to {destination}.
    Here is their generated itinerary:
    
    {itinerary}
    
    Your rules:
    1. Answer ONLY questions related to this trip, destination, and itinerary.
    2. If the user asks about general knowledge, other countries, or unrelated topics, politely refuse and remind them you can only assist with their {destination} trip.
    3. Keep responses concise, helpful, and formatted in markdown.
    """
    chat_history = [SystemMessage(content=system_prompt)]
    
    for msg in messages:
        if msg["role"] == "user":
            chat_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "ai":
            chat_history.append(AIMessage(content=msg["content"]))
            
    response = llm.invoke(chat_history)
    return response.content
