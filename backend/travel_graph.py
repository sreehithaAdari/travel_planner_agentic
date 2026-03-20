import os
from typing import Literal
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from travel_state import TravelState

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

def user_preference(state: TravelState):
    """Agent 1: Processes user preferences and formats the initial request."""
    return {"current_plan": f"Processing trip to {state['destination']} for {state['days']} days."}

def budget_estimation(state: TravelState):
    """Agent 4: Estimates the budget required for the trip."""
    prompt = f"""
    Estimate the total cost in USD for a trip with the following details:
    Destination: {state['destination']}
    Duration: {state['days']} days
    People: {state['people']} ({state['adults']} adults, {state['children']} children)
    Travel Type: {state['travel_type']}
    
    Return ONLY a number representing the estimated cost in USD. No symbols or extra text.
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
    Generate a detailed {state['travel_type']} itinerary for a {state['days']}-day trip to {state['destination']}.
    Budget: ${state['budget']} (Sufficient for {state['travel_type']})
    Travelers: {state['people']} ({state['adults']} adults, {state['children']} children)
    
    Include:
    - Where to stay
    - What to eat
    - Major places to visit
    - Daily activities (specifically catering to children if there are any, else focus on adults).
    
    Format the response clearly in Markdown.
    """
    response = llm.invoke(prompt)
    return {"final_itinerary": response.content}

def budget_insufficient(state: TravelState):
    """Agent 6: Analyzes the shortfall and provides reasoning."""
    shortfall = state['estimated_cost'] - state['budget']
    reason = f"Budget is insufficient for {state['travel_type']} travel to {state['destination']}. Estimated: ${state['estimated_cost']}, Provided: ${state['budget']}."
    return {"adjustments_made": reason}

def adjust_plan(state: TravelState):
    """Agent 7: Generates a readjusted itinerary fitting the lower budget."""
    prompt = f"""
    The user requested a {state['travel_type']} trip to {state['destination']} for {state['days']} days, but the budget (${state['budget']}) is insufficient (Estimated cost was ${state['estimated_cost']}).
    
    Readjust the plan to fit the user's provided budget of ${state['budget']}.
    Travelers: {state['people']} ({state['adults']} adults, {state['children']} children).
    
    Include:
    - Explanation of budget adjustments (e.g., staying in cheaper hotels, eating at budget restaurants)
    - Where to stay (budget-friendly options)
    - What to eat (cheap eats)
    - Major places to visit (free or low-cost activities)
    - Daily activities (specifically catering to children if there are any).
    
    Format the response clearly in Markdown.
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
