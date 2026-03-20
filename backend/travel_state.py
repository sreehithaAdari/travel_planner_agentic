from typing import TypedDict, Optional

class TravelState(TypedDict):
    # User Preferences
    destination: str
    days: int
    people: int
    adults: int
    children: int
    budget: float
    travel_type: str
    
    # Internal State for Graph
    budget_sufficient: Optional[bool]
    luxury_possible: Optional[bool]
    estimated_cost: Optional[float]
    adjustments_made: Optional[str]
    current_plan: Optional[str]
    final_itinerary: Optional[str]
