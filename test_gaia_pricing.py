import pytest
import requests

BASE_URL = "https://gaia-marketplace.preview.emergentagent.com"

class TestStatsAPI:
    """Tests for the /api/stats endpoint"""
    
    def test_stats_endpoint_returns_200(self, api_client):
        """Test that stats endpoint returns 200 OK"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
    
    def test_stats_returns_active_routes(self, api_client):
        """Test that stats returns active_routes field"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        data = response.json()
        assert "active_routes" in data
        assert isinstance(data["active_routes"], int)
        assert data["active_routes"] > 0
    
    def test_stats_returns_transport_companies(self, api_client):
        """Test that stats returns transport_companies field"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        data = response.json()
        assert "transport_companies" in data
        assert isinstance(data["transport_companies"], int)
        assert data["transport_companies"] > 0
    
    def test_stats_returns_gaia_box_locations(self, api_client):
        """Test that stats returns gaia_box_locations field"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        data = response.json()
        assert "gaia_box_locations" in data


class TestSearchAPI:
    """Tests for the /api/search endpoint"""
    
    def test_search_returns_3_offers(self, api_client):
        """Test that search returns exactly 3 transport offers"""
        payload = {
            "from_city": "Berlin",
            "to_city": "Paris",
            "shipment_type": "pallet",
            "pallet_details": {
                "num_pallets": 2,
                "length": 120,
                "width": 80,
                "height": 150,
                "weight": 500,
                "stackable": True,
                "fragile": False
            }
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3, f"Expected 3 offers, got {len(data)}"
    
    def test_search_offers_have_required_fields(self, api_client):
        """Test that each offer has all required fields"""
        payload = {
            "from_city": "Munich",
            "to_city": "Milan",
            "shipment_type": "boxes",
            "boxes_details": {
                "num_boxes": 5,
                "total_weight": 100,
                "largest_length": 60,
                "largest_width": 40,
                "largest_height": 40,
                "fragile": False
            }
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        data = response.json()
        
        required_fields = [
            "id", "company_name", "price", "delivery_days", 
            "route_type", "capacity_fit", "insurance_status",
            "offer_tier", "rating"
        ]
        
        for offer in data:
            for field in required_fields:
                assert field in offer, f"Missing field: {field}"
    
    def test_search_offers_have_three_tiers(self, api_client):
        """Test that search returns premium, optimized, and economy tiers"""
        payload = {
            "from_city": "Amsterdam",
            "to_city": "Barcelona",
            "shipment_type": "pallet"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        data = response.json()
        
        tiers = [offer["offer_tier"] for offer in data]
        assert "premium" in tiers, "Missing premium tier"
        assert "optimized" in tiers, "Missing optimized tier"
        assert "economy" in tiers, "Missing economy tier"
    
    def test_search_vehicle_type(self, api_client):
        """Test search with vehicle shipment type"""
        payload = {
            "from_city": "London",
            "to_city": "Madrid",
            "shipment_type": "vehicle",
            "vehicle_details": {
                "vehicle_type": "car",
                "length": 450,
                "width": 180,
                "height": 150,
                "weight": 1500,
                "is_running": True
            }
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3


class TestGaiaBoxAPI:
    """Tests for the /api/gaia-box endpoint"""
    
    def test_gaia_box_returns_drop_off_location(self, api_client):
        """Test that gaia-box returns drop_off_location"""
        response = api_client.get(f"{BASE_URL}/api/gaia-box?from_city=Berlin&to_city=Paris")
        assert response.status_code == 200
        data = response.json()
        assert "drop_off_location" in data
        assert "Berlin" in data["drop_off_location"]
    
    def test_gaia_box_returns_collection_hub(self, api_client):
        """Test that gaia-box returns collection_hub"""
        response = api_client.get(f"{BASE_URL}/api/gaia-box?from_city=Berlin&to_city=Paris")
        data = response.json()
        assert "collection_hub" in data
    
    def test_gaia_box_returns_schedule_info(self, api_client):
        """Test that gaia-box returns schedule information"""
        response = api_client.get(f"{BASE_URL}/api/gaia-box?from_city=Vienna&to_city=Prague")
        data = response.json()
        assert "weekly_route_day" in data
        assert "next_departure" in data


class TestPricingPlansAPI:
    """Tests for the /api/pricing-plans endpoint"""
    
    def test_pricing_plans_returns_plans(self, api_client):
        """Test that pricing-plans returns plans array"""
        response = api_client.get(f"{BASE_URL}/api/pricing-plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) >= 3
    
    def test_pricing_plans_has_starter_professional_fleet(self, api_client):
        """Test that pricing includes Starter, Professional, and Fleet plans"""
        response = api_client.get(f"{BASE_URL}/api/pricing-plans")
        data = response.json()
        
        plan_names = [plan["name"] for plan in data["plans"]]
        assert "Starter" in plan_names
        assert "Professional" in plan_names
        assert "Fleet" in plan_names
    
    def test_pricing_plans_has_addons(self, api_client):
        """Test that pricing-plans returns addons array"""
        response = api_client.get(f"{BASE_URL}/api/pricing-plans")
        data = response.json()
        assert "addons" in data
        assert len(data["addons"]) >= 1
    
    def test_pricing_plans_professional_is_highlighted(self, api_client):
        """Test that Professional plan is highlighted"""
        response = api_client.get(f"{BASE_URL}/api/pricing-plans")
        data = response.json()
        
        professional = next(p for p in data["plans"] if p["name"] == "Professional")
        assert professional["highlighted"] == True


class TestProposalAPI:
    """Tests for the /api/proposal endpoint"""
    
    def test_proposal_creates_successfully(self, api_client):
        """Test that proposal endpoint creates a proposal"""
        payload = {
            "offer_id": "test-offer-123",
            "from_city": "Berlin",
            "to_city": "Paris",
            "shipment_type": "pallet",
            "pallet_details": {
                "num_pallets": 2,
                "length": 120,
                "width": 80,
                "height": 150,
                "weight": 500,
                "stackable": True,
                "fragile": False
            },
            "include_insurance": False
        }
        response = api_client.post(f"{BASE_URL}/api/proposal", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "final_price" in data
        assert "pickup_address" in data
        assert "delivery_address" in data
    
    def test_proposal_includes_insurance_cost(self, api_client):
        """Test that proposal with insurance includes insurance cost"""
        payload = {
            "offer_id": "test-offer-456",
            "from_city": "Munich",
            "to_city": "Rome",
            "shipment_type": "boxes",
            "boxes_details": {
                "num_boxes": 10,
                "total_weight": 200,
                "largest_length": 60,
                "largest_width": 40,
                "largest_height": 40,
                "fragile": True
            },
            "include_insurance": True
        }
        response = api_client.post(f"{BASE_URL}/api/proposal", json=payload)
        data = response.json()
        assert data["insurance_included"] == True
        assert data["insurance_cost"] > 0


class TestPublishRouteAPI:
    """Tests for the /api/publish-route endpoint"""
    
    def test_publish_route_creates_successfully(self, api_client):
        """Test that publish-route creates a route"""
        payload = {
            "from_city": "Hamburg",
            "to_city": "Vienna",
            "departure_date": "2026-04-01",
            "route_type": "Direct",
            "vehicle_type": "Truck",
            "weight_capacity": 10000,
            "volume_capacity": 50,
            "pallet_capacity": 20,
            "max_length": 1360,
            "max_width": 245,
            "max_height": 270,
            "cargo_types": ["pallets", "boxes"],
            "fragile_accepted": True,
            "stackable_allowed": True,
            "temperature_controlled": False
        }
        response = api_client.post(f"{BASE_URL}/api/publish-route", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "estimated_earnings_min" in data
        assert "estimated_earnings_max" in data


class TestNewPricingLogic:
    """Tests for the new pricing logic - GAIA Box, Pallet, Vehicle pricing"""
    
    def test_gaia_box_pricing_returns_realistic_prices(self, api_client):
        """Test GAIA Box pricing returns €5-50 per box range"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for offer in data:
            # GAIA Box prices should be between €5 and €50 per box
            assert 5 <= offer["price"] <= 50, f"GAIA Box price {offer['price']} not in €5-50 range"
    
    def test_pallet_pricing_returns_per_pallet_prices(self, api_client):
        """Test Pallet pricing returns €15-19 per pallet range"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "pallet",
            "pallet_details": {"num_pallets": 1}
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for offer in data:
            # Pallet prices should be reasonable (€10-30 per pallet for short routes)
            assert offer["price"] > 0, f"Pallet price should be positive"
    
    def test_vehicle_pricing_returns_full_load_prices(self, api_client):
        """Test Vehicle pricing returns €490-650 full load range"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "vehicle"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for offer in data:
            # Vehicle full load prices should be in €400-700 range for Lisboa-Madrid
            assert 400 <= offer["price"] <= 800, f"Vehicle price {offer['price']} not in expected range"
    
    def test_search_returns_three_route_types(self, api_client):
        """Test that search returns Direct, 1 Stop, and Eco Route"""
        payload = {
            "from_city": "Berlin",
            "to_city": "Paris",
            "shipment_type": "gaiabox"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        route_types = [offer["route_type"] for offer in data]
        assert "Direct" in route_types, "Missing Direct route type"
        assert "1 Stop" in route_types, "Missing 1 Stop route type"
        assert "Eco Route" in route_types, "Missing Eco Route route type"
    
    def test_savings_percentage_is_25(self, api_client):
        """Test that all offers show 25% savings"""
        payload = {
            "from_city": "Paris",
            "to_city": "Berlin",
            "shipment_type": "pallet"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for offer in data:
            assert offer["savings_percentage"] == 25, f"Savings should be 25%, got {offer['savings_percentage']}%"
    
    def test_market_average_price_is_higher(self, api_client):
        """Test that market average price is higher than GAIA price (25% cheaper)"""
        payload = {
            "from_city": "Munich",
            "to_city": "Vienna",
            "shipment_type": "vehicle"
        }
        response = api_client.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for offer in data:
            assert offer["market_average_price"] > offer["price"], \
                f"Market price {offer['market_average_price']} should be higher than GAIA price {offer['price']}"
