from typing import TypedDict, Optional, Literal, Annotated
from pydantic import BaseModel, Field, model_validator
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage

class TripRequest(BaseModel):
    destination: str = Field(..., min_length=2, description="Destination string, valid place in the world.")
    days: int = Field(..., gt=0)
    people: int = Field(..., gt=0)
    adults: int = Field(..., ge=1)
    children: int = Field(..., ge=0)
    budget: int = Field(..., gt=0)
    currency: Literal["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"] = Field(default="USD")
    travel_type: Literal["luxury", "budget-friendly", "Luxury", "Budget-friendly"]

    @model_validator(mode='after')
    def check_people_count(self) -> 'TripRequest':
        if self.people != self.adults + self.children:
            raise ValueError('Total people must be equal to adults + children')
        return self

class TravelState(TypedDict):
    # User Preferences
    destination: str
    days: int
    people: int
    adults: int
    children: int
    budget: int
    currency: str
    travel_type: str
    
    # Internal State for Graph
    budget_sufficient: Optional[bool]
    luxury_possible: Optional[bool]
    estimated_cost: Optional[float]
    adjustments_made: Optional[str]
    current_plan: Optional[str]
    final_itinerary: Optional[str]
    
    # Chat History
    messages: Annotated[list[AnyMessage], add_messages]
