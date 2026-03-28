from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import random
import hashlib
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class PalletDetails(BaseModel):
    num_pallets: int = 1
    length: float = 120
    width: float = 80
    height: float = 150
    weight: float = 500
    stackable: bool = True
    fragile: bool = False

class BoxesDetails(BaseModel):
    num_boxes: int = 1
    total_weight: float = 100
    largest_length: float = 60
    largest_width: float = 40
    largest_height: float = 40
    fragile: bool = False

class VehicleDetails(BaseModel):
    vehicle_type: str = "car"
    length: float = 450
    width: float = 180
    height: float = 150
    weight: float = 1500
    is_running: bool = True

class MovingDetails(BaseModel):
    total_volume: float = 20
    approximate_weight: float = 1000
    large_items: int = 5

class SearchRequest(BaseModel):
    from_city: str
    to_city: str
    shipment_type: str
    pallet_details: Optional[PalletDetails] = None
    boxes_details: Optional[BoxesDetails] = None
    vehicle_details: Optional[VehicleDetails] = None
    moving_details: Optional[MovingDetails] = None

class TransportOffer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    contact_email: str
    contact_phone: str
    price: float
    market_average_price: float
    savings_percentage: int
    delivery_days: int
    route_type: str
    pickup_date: str
    pickup_time_window: str
    delivery_date: str
    delivery_time_window: str
    capacity_fit: int
    insurance_status: str
    insurance_description: str
    vehicle_type: str
    rating: float
    offer_tier: str
    tier_description: str
    stops: List[str] = []
    companies_used_this_week: int = 0

class ProposalRequest(BaseModel):
    offer_id: str
    from_city: str
    to_city: str
    shipment_type: str
    pallet_details: Optional[PalletDetails] = None
    boxes_details: Optional[BoxesDetails] = None
    vehicle_details: Optional[VehicleDetails] = None
    moving_details: Optional[MovingDetails] = None
    include_insurance: bool = False

class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    offer_id: str
    final_price: float
    pickup_address: str
    delivery_address: str
    pickup_date: str
    pickup_time_window: str
    delivery_date: str
    delivery_time_window: str
    insurance_included: bool
    insurance_cost: float
    company_name: str
    contact_person: str
    contact_email: str
    contact_phone: str
    capacity_type: str
    validity_hours: int = 24
    shipment_summary: Dict[str, Any]

class GaiaBoxConfig(BaseModel):
    enabled: bool = False
    num_boxes: int = 5
    box_size: str = "Medium"
    location: str = ""
    pickup_radius: int = 25
    availability: str = "Daily"
    price_per_box: float = 12.0
    auto_fill_enabled: bool = True

class PublishRouteRequest(BaseModel):
    from_city: str
    to_city: str
    departure_date: str
    route_type: str
    vehicle_type: str
    weight_capacity: float
    volume_capacity: float
    pallet_capacity: int
    max_length: float
    max_width: float
    max_height: float
    cargo_types: List[str]
    fragile_accepted: bool
    stackable_allowed: bool
    temperature_controlled: bool
    price_per_kg: Optional[float] = None
    price_per_pallet: Optional[float] = None
    fixed_price: Optional[float] = None
    gaia_box_config: Optional[GaiaBoxConfig] = None

class PublishedRoute(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_city: str
    to_city: str
    departure_date: str
    route_type: str
    vehicle_type: str
    weight_capacity: float
    volume_capacity: float
    pallet_capacity: int
    max_length: float
    max_width: float
    max_height: float
    cargo_types: List[str]
    fragile_accepted: bool
    stackable_allowed: bool
    temperature_controlled: bool
    price_per_kg: Optional[float] = None
    price_per_pallet: Optional[float] = None
    fixed_price: Optional[float] = None
    estimated_earnings_min: float
    estimated_earnings_max: float
    gaia_box_earnings_min: float = 120.0  # Default for legacy data
    gaia_box_earnings_max: float = 400.0  # Default for legacy data
    gaia_box_enabled: bool = False
    weekly_gaia_box_requests: str = "3-8"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SampleRequest(BaseModel):
    route: str
    cargo_type: str
    suggested_price: float
    weight: str
    pickup_date: str
    is_gaia_box: bool = False

# ============ COMPANY DATA ============

PREMIUM_COMPANIES = [
    {"name": "EuroSpeed Express", "rating": 4.9, "contact": "Klaus Weber", "email": "dispatch@eurospeed.eu", "phone": "+49 89 1234 5678"},
    {"name": "TransEuropa Direct", "rating": 4.8, "contact": "Maria Schmidt", "email": "bookings@transeuropa.de", "phone": "+49 30 9876 5432"},
    {"name": "FastTrack Logistics", "rating": 4.9, "contact": "Jean Dupont", "email": "ops@fasttrack-log.fr", "phone": "+33 1 4567 8901"},
    {"name": "PrimeMove GmbH", "rating": 4.7, "contact": "Hans Mueller", "email": "transport@primemove.de", "phone": "+49 40 2345 6789"},
    {"name": "SwiftCargo International", "rating": 4.8, "contact": "Anna Berg", "email": "cargo@swiftcargo.se", "phone": "+46 8 123 4567"},
]

OPTIMIZED_COMPANIES = [
    {"name": "LogiNet Solutions", "rating": 4.5, "contact": "Peter van Dijk", "email": "routing@loginet.nl", "phone": "+31 20 345 6789"},
    {"name": "CargoLink Europe", "rating": 4.4, "contact": "Sophie Martin", "email": "dispatch@cargolink.eu", "phone": "+32 2 456 7890"},
    {"name": "TransConnect Pro", "rating": 4.6, "contact": "Marco Rossi", "email": "booking@transconnect.it", "phone": "+39 02 567 8901"},
    {"name": "FlexiFreight AG", "rating": 4.3, "contact": "Lisa Schneider", "email": "freight@flexifreight.ch", "phone": "+41 44 678 9012"},
    {"name": "SmartRoute Logistics", "rating": 4.5, "contact": "Jan Kowalski", "email": "smart@smartroute.pl", "phone": "+48 22 789 0123"},
]

ECONOMY_COMPANIES = [
    {"name": "BudgetCargo Express", "rating": 4.1, "contact": "Carlos Garcia", "email": "budget@budgetcargo.es", "phone": "+34 91 234 5678"},
    {"name": "EcoTransport EU", "rating": 4.0, "contact": "Nina Andersson", "email": "eco@ecotransport.eu", "phone": "+46 31 345 6789"},
    {"name": "ValueFreight Services", "rating": 4.2, "contact": "Tom Wilson", "email": "value@valuefreight.co.uk", "phone": "+44 20 456 7890"},
    {"name": "SaveShip International", "rating": 3.9, "contact": "David Brown", "email": "save@saveship.ie", "phone": "+353 1 567 8901"},
    {"name": "ThriftLogistics Co", "rating": 4.0, "contact": "Eva Novak", "email": "thrift@thriftlog.cz", "phone": "+420 2 678 9012"},
]

EUROPEAN_HUBS = ["Frankfurt", "Rotterdam", "Milan", "Barcelona", "Warsaw", "Vienna", "Brussels", "Lyon", "Munich", "Prague"]
VEHICLE_TYPES = ["18t Truck", "40t Truck", "Sprinter Van", "7.5t Box Truck", "Curtainsider"]

TIER_DESCRIPTIONS = {
    "premium": "Best for time-critical shipments",
    "optimized": "Best balance between cost and time",
    "economy": "Lowest cost option (longer delivery)"
}

# ============ PRICING CONSTANTS (FINAL VERSION) ============

BASE_RATE_TRUCK = 1.4  # €/km (market rate)
GAIA_DISCOUNT = 0.75   # 25% cheaper than market
GAIA_RATE_BOX = 0.08   # €/kg/km for GAIA Box
EFFICIENCY_FACTOR = 0.15  # Due to unused capacity optimization
PALLET_CAPACITY = 33   # Number of pallets per truck
DEFAULT_DISTANCE_KM = 1200  # Fallback distance
DEFAULT_WEIGHT_KG = 10  # Default box weight

# Distance estimates between major European cities (km)
CITY_DISTANCES = {
    ("lisboa", "madrid"): 625,
    ("lisboa", "paris"): 1735,
    ("lisboa", "berlin"): 2850,
    ("madrid", "paris"): 1270,
    ("madrid", "berlin"): 2310,
    ("paris", "berlin"): 1050,
    ("paris", "amsterdam"): 500,
    ("berlin", "amsterdam"): 660,
    ("berlin", "warsaw"): 575,
    ("berlin", "prague"): 350,
    ("berlin", "vienna"): 680,
    ("porto", "madrid"): 595,
    ("porto", "paris"): 1455,
    ("porto", "berlin"): 2570,
    ("barcelona", "paris"): 1035,
    ("barcelona", "madrid"): 620,
    ("milan", "paris"): 850,
    ("milan", "berlin"): 1040,
    ("london", "paris"): 460,
    ("london", "amsterdam"): 540,
    ("munich", "berlin"): 585,
    ("munich", "vienna"): 435,
    ("rome", "milan"): 575,
    ("rome", "paris"): 1420,
}

def get_distance_km(from_city: str, to_city: str) -> int:
    """Get distance between cities, with fallback calculation"""
    from_lower = from_city.lower().strip()
    to_lower = to_city.lower().strip()
    
    # Check direct lookup
    if (from_lower, to_lower) in CITY_DISTANCES:
        return CITY_DISTANCES[(from_lower, to_lower)]
    if (to_lower, from_lower) in CITY_DISTANCES:
        return CITY_DISTANCES[(to_lower, from_lower)]
    
    # Generate consistent distance based on city names
    combined = f"{from_lower}{to_lower}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    return 400 + (hash_val % 2000)  # 400-2400 km range

def calculate_gaia_box_price(weight_kg: float, distance_km: int, multiplier: float = 1.0) -> float:
    """Calculate GAIA Box price based on weight and distance - per box"""
    # Pricing tiers based on weight:
    # Small (up to 5kg): €5-15
    # Medium (up to 15kg): €15-30
    # Large (up to 30kg): €30-50
    
    # Base rate adjusted for realistic micro-shipment pricing
    base_rate = 0.012  # €/kg/km for aggregated shipments (much lower due to consolidation)
    
    base_price = weight_kg * (distance_km / 100) * base_rate  # Distance factor reduced
    
    # Add minimum base cost
    if weight_kg <= 5:
        base_price += 5  # Small box base
    elif weight_kg <= 15:
        base_price += 12  # Medium box base
    else:
        base_price += 25  # Large box base
    
    price = base_price * multiplier
    
    # Apply limits per box
    if price < 5:
        price = 5
    elif price > 50:
        price = 50
    
    return round(price, 2)

def calculate_pallet_price(distance_km: int, num_pallets: int, multiplier: float = 1.0) -> float:
    """Calculate pallet price (per pallet)"""
    route_cost = distance_km * BASE_RATE_TRUCK
    gaia_cost = route_cost * GAIA_DISCOUNT
    price_per_pallet = (gaia_cost / PALLET_CAPACITY) * multiplier
    return round(price_per_pallet * num_pallets, 2)

def calculate_vehicle_price(distance_km: int, multiplier: float = 1.0) -> float:
    """Calculate full vehicle price"""
    route_cost = distance_km * BASE_RATE_TRUCK
    gaia_cost = route_cost * GAIA_DISCOUNT * multiplier
    return round(gaia_cost, 2)

def calculate_moving_price(distance_km: int, volume_m3: float, multiplier: float = 1.0) -> float:
    """Calculate moving price based on volume"""
    # Estimate based on volume (roughly €30-50 per m³ + distance factor)
    base_price = volume_m3 * 35
    distance_factor = distance_km * 0.5
    price = (base_price + distance_factor) * GAIA_DISCOUNT * multiplier
    return round(price, 2)

# ============ HELPER FUNCTIONS ============

def calculate_distance_factor(from_city: str, to_city: str) -> float:
    """Legacy function - now uses get_distance_km"""
    return get_distance_km(from_city, to_city)

def get_intermediate_hub(from_city: str, to_city: str, num_stops: int) -> List[str]:
    combined = f"{from_city.lower()}{to_city.lower()}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    available_hubs = [h for h in EUROPEAN_HUBS if h.lower() != from_city.lower() and h.lower() != to_city.lower()]
    stops = []
    for i in range(num_stops):
        idx = (hash_val + i * 7) % len(available_hubs)
        hub = available_hubs[idx]
        if hub not in stops:
            stops.append(hub)
    return stops[:num_stops]

def calculate_capacity_fit(search: SearchRequest, offer_tier: str) -> int:
    combined = f"{search.from_city}{search.to_city}{search.shipment_type}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:6], 16)
    if offer_tier == "premium":
        return 95 + (hash_val % 5)
    elif offer_tier == "optimized":
        return 85 + (hash_val % 10)
    else:
        return 75 + (hash_val % 15)

def get_weight_from_search(search: SearchRequest) -> float:
    if search.shipment_type == "pallet" and search.pallet_details:
        return search.pallet_details.weight * search.pallet_details.num_pallets
    elif search.shipment_type == "boxes" and search.boxes_details:
        return search.boxes_details.total_weight
    elif search.shipment_type == "vehicle" and search.vehicle_details:
        return search.vehicle_details.weight
    elif search.shipment_type == "volume" and search.moving_details:
        return search.moving_details.approximate_weight
    elif search.shipment_type == "gaiabox":
        return DEFAULT_WEIGHT_KG  # Default weight for GAIA Box
    return DEFAULT_WEIGHT_KG

def generate_offers(search: SearchRequest) -> List[TransportOffer]:
    """Generate 3 route options with realistic pricing"""
    distance_km = get_distance_km(search.from_city, search.to_city)
    weight = get_weight_from_search(search)
    
    combined = f"{search.from_city.lower()}{search.to_city.lower()}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    
    premium_company = PREMIUM_COMPANIES[hash_val % len(PREMIUM_COMPANIES)]
    optimized_company = OPTIMIZED_COMPANIES[(hash_val + 3) % len(OPTIMIZED_COMPANIES)]
    economy_company = ECONOMY_COMPANIES[(hash_val + 5) % len(ECONOMY_COMPANIES)]
    
    base_days = max(1, int(distance_km / 600))
    pickup_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Route multipliers: Direct (1.0), 1 Stop (0.85), Eco Route (0.75)
    route_configs = [
        {"type": "Direct", "multiplier": 1.0, "days_add": 0, "tier": "premium", "company": premium_company},
        {"type": "1 Stop", "multiplier": 0.85, "days_add": 1, "tier": "optimized", "company": optimized_company},
        {"type": "Eco Route", "multiplier": 0.75, "days_add": 2, "tier": "economy", "company": economy_company},
    ]
    
    offers = []
    
    for config in route_configs:
        # Calculate price based on shipment type
        if search.shipment_type == "gaiabox":
            # GAIA Box: price per box based on weight
            price = calculate_gaia_box_price(weight, distance_km, config["multiplier"])
            price_display_type = "per_box"
        elif search.shipment_type == "pallet":
            num_pallets = search.pallet_details.num_pallets if search.pallet_details else 1
            price = calculate_pallet_price(distance_km, num_pallets, config["multiplier"])
            price_display_type = "per_pallet"
        elif search.shipment_type == "vehicle":
            price = calculate_vehicle_price(distance_km, config["multiplier"])
            price_display_type = "full_load"
        elif search.shipment_type == "volume":
            volume = search.moving_details.total_volume if search.moving_details else 20
            price = calculate_moving_price(distance_km, volume, config["multiplier"])
            price_display_type = "full_service"
        else:
            # Default pricing
            route_cost = distance_km * BASE_RATE_TRUCK * GAIA_DISCOUNT
            price = round(route_cost * config["multiplier"], 2)
            price_display_type = "total"
        
        # Calculate market average (25% higher than GAIA price)
        market_price = round(price / GAIA_DISCOUNT, 2)
        savings = 25  # GAIA is always 25% cheaper
        
        delivery_days = base_days + config["days_add"]
        delivery_date = (datetime.now() + timedelta(days=1 + delivery_days)).strftime("%Y-%m-%d")
        
        # Get stops for non-direct routes
        stops = []
        if config["type"] == "1 Stop":
            stops = get_intermediate_hub(search.from_city, search.to_city, 1)
        elif config["type"] == "Eco Route":
            stops = get_intermediate_hub(search.from_city, search.to_city, 2)
        
        offers.append(TransportOffer(
            company_name=config["company"]["name"],
            contact_person=config["company"]["contact"],
            contact_email=config["company"]["email"],
            contact_phone=config["company"]["phone"],
            price=price,
            market_average_price=market_price,
            savings_percentage=savings,
            delivery_days=delivery_days,
            route_type=config["type"],
            pickup_date=pickup_date,
            pickup_time_window="08:00 - 12:00" if config["tier"] == "premium" else "08:00 - 18:00",
            delivery_date=delivery_date,
            delivery_time_window="14:00 - 18:00" if config["tier"] == "premium" else "All day",
            capacity_fit=calculate_capacity_fit(search, config["tier"]),
            insurance_status="Insurance included" if config["tier"] == "premium" else "Insurance optional",
            insurance_description="Full coverage" if config["tier"] == "premium" else "Add €25 for full coverage",
            vehicle_type=VEHICLE_TYPES[hash_val % len(VEHICLE_TYPES)],
            rating=config["company"]["rating"],
            offer_tier=config["tier"],
            tier_description=TIER_DESCRIPTIONS[config["tier"]],
            stops=stops,
            companies_used_this_week=45 + (hash_val % 30)
        ))
    
    return offers

def generate_sample_requests(from_city: str, to_city: str, gaia_box_enabled: bool = False) -> List[SampleRequest]:
    combined = f"{from_city.lower()}{to_city.lower()}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    cargo_types = ["3 Euro Pallets", "12 Boxes (fragile)", "Office furniture", "2 Pallets + boxes", "Machine parts"]
    gaia_box_types = ["GAIA Box - Small parcel", "GAIA Box - Documents", "GAIA Box - E-commerce"]
    
    requests = []
    for i in range(3):
        idx = (hash_val + i * 5) % len(cargo_types)
        requests.append(SampleRequest(
            route=f"{from_city} → {to_city}",
            cargo_type=cargo_types[idx],
            suggested_price=150 + (hash_val + i * 17) % 350,
            weight=f"{200 + (hash_val + i * 23) % 800} kg",
            pickup_date=(datetime.now() + timedelta(days=1 + i)).strftime("%Y-%m-%d"),
            is_gaia_box=False
        ))
    
    if gaia_box_enabled:
        for i in range(2):
            idx = (hash_val + i * 3) % len(gaia_box_types)
            requests.append(SampleRequest(
                route=f"{from_city} → {to_city}",
                cargo_type=gaia_box_types[idx],
                suggested_price=8 + (hash_val + i * 7) % 20,
                weight="< 10 kg",
                pickup_date=(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                is_gaia_box=True
            ))
    
    return requests

# ============ API ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "GAIA Logistics API v2.0"}

@api_router.get("/export")
async def export_project_zip():
    zip_path = ROOT_DIR / "gaia-marketplace.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP file not found")
    return FileResponse(
        path=str(zip_path),
        filename="gaia-marketplace.zip",
        media_type="application/zip"
    )

@api_router.get("/stats")
async def get_stats():
    return {
        "active_routes": 12847,
        "transport_companies": 3512,
        "gaia_box_locations": 847,
        "live_demand_regions": [
            {"region": "Western Europe", "demand": "High"},
            {"region": "Eastern Europe", "demand": "Medium"},
            {"region": "Southern Europe", "demand": "High"},
            {"region": "Nordic", "demand": "Medium"}
        ],
        "users_online": 1547,
        "weekly_gaia_box_shipments": 2340
    }

@api_router.post("/search", response_model=List[TransportOffer])
async def search_transport(search: SearchRequest):
    offers = generate_offers(search)
    await db.searches.insert_one({
        "id": str(uuid.uuid4()),
        "from_city": search.from_city,
        "to_city": search.to_city,
        "shipment_type": search.shipment_type,
        "timestamp": datetime.utcnow(),
        "offers_count": len(offers)
    })
    return offers

@api_router.get("/gaia-box")
async def get_gaia_box(from_city: str, to_city: str):
    combined = f"{from_city.lower()}{to_city.lower()}"
    hash_val = int(hashlib.md5(combined.encode()).hexdigest()[:8], 16)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    hub = EUROPEAN_HUBS[hash_val % len(EUROPEAN_HUBS)]
    return {
        "drop_off_location": f"{from_city} Central Logistics Hub",
        "collection_hub": f"{hub} Distribution Center",
        "weekly_route_day": days[hash_val % len(days)],
        "next_departure": (datetime.now() + timedelta(days=(hash_val % 7))).strftime("%Y-%m-%d"),
        "message": "This route operates weekly with shared cargo aggregation"
    }

@api_router.post("/proposal", response_model=Proposal)
async def create_proposal(request: ProposalRequest):
    search = SearchRequest(
        from_city=request.from_city,
        to_city=request.to_city,
        shipment_type=request.shipment_type,
        pallet_details=request.pallet_details,
        boxes_details=request.boxes_details,
        vehicle_details=request.vehicle_details,
        moving_details=request.moving_details
    )
    offers = generate_offers(search)
    offer = offers[0]
    for o in offers:
        if o.id == request.offer_id:
            offer = o
            break
    
    insurance_cost = round(offer.price * 0.08, 2) if request.include_insurance else 0
    final_price = round(offer.price + insurance_cost, 2)
    
    shipment_summary = {"type": request.shipment_type}
    if request.pallet_details:
        total_weight = request.pallet_details.weight * request.pallet_details.num_pallets
        shipment_summary.update({
            "pallets": request.pallet_details.num_pallets,
            "dimensions": f"{int(request.pallet_details.length)}×{int(request.pallet_details.width)}×{int(request.pallet_details.height)} cm each",
            "total_weight": f"{int(total_weight)} kg",
            "stackable": request.pallet_details.stackable,
            "fragile": request.pallet_details.fragile
        })
    elif request.boxes_details:
        shipment_summary.update({
            "boxes": request.boxes_details.num_boxes,
            "total_weight": f"{int(request.boxes_details.total_weight)} kg",
            "largest_box": f"{int(request.boxes_details.largest_length)}×{int(request.boxes_details.largest_width)}×{int(request.boxes_details.largest_height)} cm",
            "fragile": request.boxes_details.fragile
        })
    elif request.vehicle_details:
        shipment_summary.update({
            "vehicle_type": request.vehicle_details.vehicle_type,
            "dimensions": f"{int(request.vehicle_details.length)}×{int(request.vehicle_details.width)}×{int(request.vehicle_details.height)} cm",
            "weight": f"{int(request.vehicle_details.weight)} kg",
            "running": request.vehicle_details.is_running
        })
    elif request.moving_details:
        shipment_summary.update({
            "volume": f"{request.moving_details.total_volume} m³",
            "weight": f"{int(request.moving_details.approximate_weight)} kg",
            "large_items": request.moving_details.large_items
        })
    
    capacity_type = "Direct" if offer.offer_tier == "premium" else ("Shared" if offer.offer_tier == "optimized" else "Consolidated")
    
    proposal = Proposal(
        offer_id=request.offer_id,
        final_price=final_price,
        pickup_address=f"{request.from_city} Industrial Zone, Loading Bay 12",
        delivery_address=f"{request.to_city} Logistics Park, Gate B",
        pickup_date=offer.pickup_date,
        pickup_time_window=offer.pickup_time_window,
        delivery_date=offer.delivery_date,
        delivery_time_window=offer.delivery_time_window,
        insurance_included=request.include_insurance,
        insurance_cost=insurance_cost,
        company_name=offer.company_name,
        contact_person=offer.contact_person,
        contact_email=offer.contact_email,
        contact_phone=offer.contact_phone,
        capacity_type=capacity_type,
        validity_hours=24,
        shipment_summary=shipment_summary
    )
    await db.proposals.insert_one(proposal.dict())
    return proposal

@api_router.post("/publish-route", response_model=PublishedRoute)
async def publish_route(request: PublishRouteRequest):
    distance_factor = calculate_distance_factor(request.from_city, request.to_city)
    base_earnings = distance_factor * 0.15
    
    if request.price_per_kg:
        base_earnings = request.weight_capacity * request.price_per_kg * 0.7
    elif request.price_per_pallet:
        base_earnings = request.pallet_capacity * request.price_per_pallet * 0.8
    elif request.fixed_price:
        base_earnings = request.fixed_price
    
    earnings_min = round(base_earnings * 0.6, 2)
    earnings_max = round(base_earnings * 1.2, 2)
    
    # GAIA Box earnings
    gaia_box_min = 120
    gaia_box_max = 400
    gaia_box_enabled = False
    if request.gaia_box_config and request.gaia_box_config.enabled:
        gaia_box_enabled = True
        gaia_box_min = round(request.gaia_box_config.num_boxes * request.gaia_box_config.price_per_box * 3, 2)
        gaia_box_max = round(request.gaia_box_config.num_boxes * request.gaia_box_config.price_per_box * 8, 2)
    
    route = PublishedRoute(
        from_city=request.from_city,
        to_city=request.to_city,
        departure_date=request.departure_date,
        route_type=request.route_type,
        vehicle_type=request.vehicle_type,
        weight_capacity=request.weight_capacity,
        volume_capacity=request.volume_capacity,
        pallet_capacity=request.pallet_capacity,
        max_length=request.max_length,
        max_width=request.max_width,
        max_height=request.max_height,
        cargo_types=request.cargo_types,
        fragile_accepted=request.fragile_accepted,
        stackable_allowed=request.stackable_allowed,
        temperature_controlled=request.temperature_controlled,
        price_per_kg=request.price_per_kg,
        price_per_pallet=request.price_per_pallet,
        fixed_price=request.fixed_price,
        estimated_earnings_min=earnings_min,
        estimated_earnings_max=earnings_max,
        gaia_box_earnings_min=gaia_box_min,
        gaia_box_earnings_max=gaia_box_max,
        gaia_box_enabled=gaia_box_enabled,
        weekly_gaia_box_requests="3-8"
    )
    await db.published_routes.insert_one(route.dict())
    return route

@api_router.get("/published-routes", response_model=List[PublishedRoute])
async def get_published_routes():
    routes = await db.published_routes.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    valid_routes = []
    for route in routes:
        try:
            valid_routes.append(PublishedRoute(**route))
        except Exception:
            # Skip invalid/legacy data
            continue
    return valid_routes

@api_router.get("/sample-requests")
async def get_sample_requests(from_city: str, to_city: str, gaia_box_enabled: bool = False):
    return generate_sample_requests(from_city, to_city, gaia_box_enabled)

@api_router.get("/pricing-plans")
async def get_pricing_plans():
    return {
        "plans": [
            {
                "id": "starter",
                "name": "Starter",
                "price_range": "€19-29",
                "period": "month",
                "features": ["Publish up to 5 routes/month", "Access basic demand", "Email support"],
                "highlighted": False
            },
            {
                "id": "professional",
                "name": "Professional",
                "price_range": "€49-79",
                "period": "month",
                "features": ["Unlimited routes", "Priority visibility", "Advanced analytics", "Phone support", "Access to GAIA Box network"],
                "highlighted": True
            },
            {
                "id": "fleet",
                "name": "Fleet",
                "price_range": "€149+",
                "period": "month",
                "features": ["Multi-vehicle management", "Team accounts", "API access", "Dedicated manager", "Multi-location GAIA Box management"],
                "highlighted": False
            }
        ],
        "addons": [
            {
                "id": "dispatcher_ai",
                "name": "Dispatcher AI",
                "price": "€49",
                "period": "month",
                "features": ["AI route optimization", "Smart matching", "Automated responses", "Optimizes GAIA Box distribution"]
            },
            {
                "id": "dispatcher_hybrid",
                "name": "Dispatcher Hybrid",
                "price": "€199",
                "period": "month",
                "features": ["AI + Human support", "Logistics coordination", "Route planning assistance"]
            },
            {
                "id": "full_dispatch",
                "name": "Full Dispatch Service",
                "price": "€499",
                "period": "month",
                "features": ["Complete logistics coordination", "24/7 dedicated support", "Full fleet + GAIA Box management"]
            }
        ],
        "revenue_increase": "+15% to +35% per route"
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
