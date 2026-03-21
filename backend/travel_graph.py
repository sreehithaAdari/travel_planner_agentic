import os
from typing import Literal
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from travel_state import TravelState

load_dotenv()

# Initialize Local Ollama LLM
llm = ChatOllama(
    model="qwen2.5:3b",
    temperature=0.3,
)

ITINERARY_JSON_SCHEMA = """
{
  "destination": "string",
  "summary": "string (expert overview)",
  "budget_assessment": "string (Start with 'Sufficient' or 'Insufficient'. Explain if the budget works. If it doesn't, explain how the itinerary was optimized to fit it.)",
  "total_budget_estimate": "string (formatted with correct currency)",
  "budget_breakdown": {
    "Accommodation": "number",
    "Food": "number",
    "Activities": "number",
    "Transport": "number"
  },
  "day_wise_plan": [
    {
      "day": number,
      "title": "string",
      "activities": [
        {
          "time": "morning/afternoon/evening",
          "activity": "string (specific name)",
          "location": "string (exact real place)",
          "details": "string (expert insights/tips)"
        }
      ],
      "food": {
        "breakfast": "string (dish or exact restaurant)",
        "lunch": "string (dish or exact restaurant)",
        "dinner": "string (dish or exact restaurant)"
      },
      "stay": {
        "hotel_name": "string (real hotel)",
        "type": "budget/luxury",
        "approx_price": "string"
      }
    }
  ],
  "must_visit_places": ["string (real places)"],
  "food_recommendations": ["string (specific dishes/spots)"],
  "travel_tips": ["string (local logistics/culture)"],
  "local_insights": ["string (hidden gems)"],
  "packing_suggestions": ["string"]
}
"""

def user_preference(state: TravelState):
    """Agent 1: Deeply analyzes user preferences and destination context."""
    group_type = "family" if state['children'] > 0 else "couple" if state['people'] == 2 else "solo" if state['people'] == 1 else "group"
    
    system_prompt = "You are an expert travel analyst. Provide a brief expert reasoning and classification for the planning flow based on the user's destination, duration, and group type."
    analysis_content = f"""
    Analyze this trip request:
    Destination: {state['destination']}
    Days: {state['days']}
    Group: {group_type} ({state['people']} people)
    Type: {state['travel_type']}
    """
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=analysis_content)])
    return {"current_plan": response.content, "messages": []}

def budget_estimation(state: TravelState):
    """Agent 4: Expert budget estimation based on destination-specific pricing."""
    system_prompt = "You are a professional travel cost estimator. Return ONLY a single number representing the estimated total cost in the requested currency. No text, no symbols."
    analysis_content = f"""
    Provide a realistic TOTAL cost estimate in {state['currency']} for:
    Destination: {state['destination']}
    Duration: {state['days']} days
    Travelers: {state['people']} ({state['adults']} adults, {state['children']} children)
    Travel Type: {state['travel_type']}
    """
    response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=analysis_content)])
    try:
        # Extract only the numbers from the response
        import re
        numbers = re.findall(r"[-+]?\d*\.\d+|\d+", response.content.replace(',', ''))
        cost = float(numbers[0]) if numbers else state['budget'] * 1.2
    except:
        cost = state['budget'] * 1.5
    return {"estimated_cost": cost}

def budget(state: TravelState):
    """Agent 2: Comparison logic."""
    sufficient = state['budget'] >= state['estimated_cost']
    return {"budget_sufficient": sufficient}

def luxury(state: TravelState):
    """Agent 3: Luxury validation."""
    if state['travel_type'].lower() == 'luxury':
        # Luxury requires a higher margin for unexpected premium upgrades
        if state['estimated_cost'] > state['budget'] * 0.85:
            return {"luxury_possible": False, "budget_sufficient": False}
        return {"luxury_possible": True}
    return {"luxury_possible": None}

GLOBAL_PLANNER_RULES = """
1. Act as a professional travel planner with 10+ years of experience.
2. NEVER use generic phrases like "visit local attractions", "try local food", or "explore the city".
3. ALWAYS use real place names, specific street names, and exact restaurant/hotel names.
4. Be realistic about travel times between locations.
5. IF CHILDREN ARE PRESENT (children > 0), you MUST explicitly include activities labeled with "[Kid-Friendly]", schedule breaks, and choose child-friendly dining for EVERY single day. This is a STRICT requirement.
6. Provide expert "Local Insights" that regular tourists wouldn't know.
7. Return ONLY valid raw JSON that follows the provided schema. No markdown code blocks, no preamble.
8. ALWAYS use the user's requested currency symbol (e.g., INR ₹, EUR €, GBP £, USD $) for ALL prices. Never default to $.
9. Do NOT change the destination to match the currency. For example, if destination is Paris and currency is INR, you MUST generate an itinerary for Paris, France. Calculate costs in local currency, then CONVERT them to display in the user's requested currency.
"""

def budget_sufficient(state: TravelState):
    """Agent 5: Generates a premium, detailed itinerary in JSON format."""
    system_msg = f"{GLOBAL_PLANNER_RULES}\n\nYou must return ONLY valid raw JSON that follows the provided schema exactly."
    user_content = f"""
    Generate a HIGHLY DETAILED expert-level {state['travel_type']} itinerary for:
    {state['destination']} | {state['days']} Days | {state['people']} People ({state['adults']}A, {state['children']}C)
    Budget: {state['budget']} {state['currency']}
    
    Required JSON structure:
    {ITINERARY_JSON_SCHEMA}
    """
    response = llm.invoke([SystemMessage(content=system_msg), HumanMessage(content=user_content)])
    return {"final_itinerary": response.content}

def budget_insufficient(state: TravelState):
    """Agent 6: Expert shortfall analysis."""
    shortfall = state['estimated_cost'] - state['budget']
    reason = f"Based on current market rates in {state['destination']}, a {state['travel_type']} trip requires approximately {state['estimated_cost']} {state['currency']}. You are currently {shortfall} {state['currency']} under the recommended budget for this experience."
    return {"adjustments_made": reason}

def adjust_plan(state: TravelState):
    """Agent 7: Optimizes and scales the plan to fit the limited budget while maintaining quality."""
    system_msg = f"{GLOBAL_PLANNER_RULES}\n\nYou must return ONLY valid raw JSON that follows the provided schema exactly."
    user_content = f"""
    The user wants a trip to {state['destination']} but has a limited budget.
    Original Target Style: {state['travel_type']}
    Available Budget: {state['budget']} {state['currency']}
    Insufficient Amount: {state['adjustments_made']}
    
    TASK: Generate a high-quality, realistic optimized itinerary that fits the {state['budget']} {state['currency']} limit.
    - Replace luxury hotels with charming, high-rated boutique budget stays.
    - Focus on high-value, authentic local experiences over expensive tourist traps.
    - Provide budget optimization tips in the "travel_tips" section.
    
    Required JSON structure:
    {ITINERARY_JSON_SCHEMA}
    """
    response = llm.invoke([SystemMessage(content=system_msg), HumanMessage(content=user_content)])
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

def chat_agent(messages: list, itinerary_json_str: str, destination: str):
    """Handles professional chat interaction scoped strictly to the expert itinerary."""
    system_prompt = f"""
    You are an elite, professional travel consultant with 10+ years of experience.
    The user is currently viewing a highly detailed itinerary for {destination}.
    
    ITINERARY DATA (JSON):
    {itinerary_json_str}
    
    Your rules:
    1. Act as the author of this itinerary. Be confident, professional, and helpful.
    2. STRICTLY answer questions ONLY related to this trip, this specific destination, travel advice, or the specific spots mentioned in the JSON.
    3. If the user asks an out-of-scope, irrelevant, or non-travel related question, you MUST politely decline to answer, state that you are an AI Travel Planner, and ask them to keep the topic focused on their trip to {destination}.
    4. Use the details in the JSON (like local insights and specific activities) to provide deep, expert-level answers.
    5. If the user asks for changes, explain that they can use the "Edit Trip" button to regenerate a new plan, or provide verbal suggestions they can keep in mind.
    6. Maintain a sophisticated but welcoming tone.
    7. Format your responses in clean Markdown.
    """
    chat_history = [SystemMessage(content=system_prompt)]
    
    for msg in messages:
        if msg["role"] == "user":
            chat_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "ai":
            chat_history.append(AIMessage(content=msg["content"]))
            
    response = llm.invoke(chat_history)
    return response.content
