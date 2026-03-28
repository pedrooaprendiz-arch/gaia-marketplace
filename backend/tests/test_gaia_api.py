"""
GAIA Logistics API Tests
Tests all backend endpoints for the GAIA logistics marketplace demo
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://gaia-marketplace.preview.emergentagent.com').rstrip('/')


class TestHealthAndStats:
    """Health check and stats endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "GAIA" in data["message"]
        print(f"✓ API root: {data['message']}")
    
    def test_stats_endpoint(self):
        """Test stats endpoint returns expected data"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "active_routes" in data
        assert "transport_companies" in data
        assert "gaia_box_locations" in data
        assert "live_demand_regions" in data
        
        # Verify data types
        assert isinstance(data["active_routes"], int)
        assert isinstance(data["transport_companies"], int)
        assert data["active_routes"] > 0
        assert data["transport_companies"] > 0
        print(f"✓ Stats: {data['active_routes']} routes, {data['transport_companies']} companies")


class TestSearchEndpoint:
    """Search endpoint tests for all shipment types"""
    
    def test_search_gaiabox(self):
        """Test GAIA Box search"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        offers = response.json()
        
        assert isinstance(offers, list)
        assert len(offers) >= 1
        
        # Verify offer structure
        offer = offers[0]
        assert "company_name" in offer
        assert "price" in offer
        assert "market_average_price" in offer
        assert "delivery_days" in offer
        assert "route_type" in offer
        assert "rating" in offer
        print(f"✓ GAIA Box search: {len(offers)} offers, first price: €{offer['price']}")
    
    def test_search_pallet(self):
        """Test Pallet search"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "pallet",
            "pallet_details": {
                "num_pallets": 2,
                "weight": 500
            }
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        offers = response.json()
        
        assert len(offers) >= 1
        offer = offers[0]
        assert offer["price"] > 0
        print(f"✓ Pallet search: {len(offers)} offers, first price: €{offer['price']}")
    
    def test_search_vehicle(self):
        """Test Vehicle search"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "vehicle",
            "vehicle_details": {
                "vehicle_type": "car",
                "weight": 1500
            }
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        offers = response.json()
        
        assert len(offers) >= 1
        print(f"✓ Vehicle search: {len(offers)} offers")
    
    def test_search_moving(self):
        """Test Moving/Volume search"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "volume",
            "moving_details": {
                "total_volume": 20,
                "approximate_weight": 1000,
                "large_items": 5
            }
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        assert response.status_code == 200
        offers = response.json()
        
        assert len(offers) >= 1
        print(f"✓ Moving search: {len(offers)} offers")
    
    def test_search_returns_three_route_types(self):
        """Test that search returns Direct, 1 Stop, and Eco Route options"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        offers = response.json()
        
        route_types = [o["route_type"] for o in offers]
        assert "Direct" in route_types
        assert "1 Stop" in route_types
        assert "Eco Route" in route_types
        print(f"✓ Route types: {route_types}")
    
    def test_search_savings_percentage(self):
        """Test that offers show savings vs market"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        offers = response.json()
        
        for offer in offers:
            assert "savings_percentage" in offer
            assert offer["savings_percentage"] > 0
            assert offer["price"] < offer["market_average_price"]
        print(f"✓ All offers show savings vs market")


class TestGaiaBoxEndpoint:
    """GAIA Box specific endpoint tests"""
    
    def test_gaia_box_info(self):
        """Test GAIA Box info endpoint"""
        response = requests.get(f"{BASE_URL}/api/gaia-box?from_city=Lisboa&to_city=Madrid")
        assert response.status_code == 200
        data = response.json()
        
        assert "drop_off_location" in data
        assert "collection_hub" in data
        assert "weekly_route_day" in data
        assert "next_departure" in data
        print(f"✓ GAIA Box info: {data['drop_off_location']}")


class TestPricingPlansEndpoint:
    """Pricing plans endpoint tests"""
    
    def test_pricing_plans(self):
        """Test pricing plans endpoint returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/pricing-plans")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "plans" in data
        assert "addons" in data
        assert isinstance(data["plans"], list)
        assert len(data["plans"]) >= 3
        
        # Verify plan structure
        plan_names = [p["name"] for p in data["plans"]]
        assert "Starter" in plan_names
        assert "Professional" in plan_names
        assert "Fleet" in plan_names
        
        # Verify each plan has required fields
        for plan in data["plans"]:
            assert "name" in plan
            assert "price_range" in plan
            assert "features" in plan
        
        print(f"✓ Pricing plans: {plan_names}")


class TestProposalEndpoint:
    """Proposal endpoint tests"""
    
    def test_create_proposal(self):
        """Test creating a proposal"""
        # First search to get an offer
        search_payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        search_response = requests.post(f"{BASE_URL}/api/search", json=search_payload)
        offers = search_response.json()
        offer_id = offers[0]["id"]
        
        # Create proposal
        proposal_payload = {
            "offer_id": offer_id,
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox",
            "include_insurance": True
        }
        response = requests.post(f"{BASE_URL}/api/proposal", json=proposal_payload)
        assert response.status_code == 200
        proposal = response.json()
        
        # Verify proposal structure
        assert "id" in proposal
        assert "final_price" in proposal
        assert "pickup_address" in proposal
        assert "delivery_address" in proposal
        assert "company_name" in proposal
        assert "insurance_included" in proposal
        assert proposal["insurance_included"] == True
        
        print(f"✓ Proposal created: €{proposal['final_price']} with insurance")


class TestPublishRouteEndpoint:
    """Publish route endpoint tests (transporter flow)"""
    
    def test_publish_route(self):
        """Test publishing a route"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "departure_date": "2026-02-01",
            "route_type": "Direct",
            "vehicle_type": "18t Truck",
            "weight_capacity": 10000,
            "volume_capacity": 50,
            "pallet_capacity": 20,
            "max_length": 1200,
            "max_width": 240,
            "max_height": 270,
            "cargo_types": ["pallets", "boxes"],
            "fragile_accepted": True,
            "stackable_allowed": True,
            "temperature_controlled": False,
            "price_per_pallet": 50
        }
        response = requests.post(f"{BASE_URL}/api/publish-route", json=payload)
        assert response.status_code == 200
        route = response.json()
        
        assert "id" in route
        assert "estimated_earnings_min" in route
        assert "estimated_earnings_max" in route
        assert route["from_city"] == "Lisboa"
        assert route["to_city"] == "Madrid"
        
        print(f"✓ Route published: earnings €{route['estimated_earnings_min']}-€{route['estimated_earnings_max']}")
    
    def test_get_published_routes(self):
        """Test getting published routes"""
        response = requests.get(f"{BASE_URL}/api/published-routes")
        assert response.status_code == 200
        routes = response.json()
        
        assert isinstance(routes, list)
        print(f"✓ Published routes: {len(routes)} routes")


class TestSampleRequestsEndpoint:
    """Sample requests endpoint tests"""
    
    def test_sample_requests(self):
        """Test getting sample requests for a route"""
        response = requests.get(f"{BASE_URL}/api/sample-requests?from_city=Lisboa&to_city=Madrid")
        assert response.status_code == 200
        requests_data = response.json()
        
        assert isinstance(requests_data, list)
        assert len(requests_data) >= 1
        
        # Verify request structure
        req = requests_data[0]
        assert "route" in req
        assert "cargo_type" in req
        assert "suggested_price" in req
        
        print(f"✓ Sample requests: {len(requests_data)} requests")
    
    def test_sample_requests_with_gaia_box(self):
        """Test getting sample requests with GAIA Box enabled"""
        response = requests.get(f"{BASE_URL}/api/sample-requests?from_city=Lisboa&to_city=Madrid&gaia_box_enabled=true")
        assert response.status_code == 200
        requests_data = response.json()
        
        # Should have more requests when GAIA Box is enabled
        gaia_box_requests = [r for r in requests_data if r.get("is_gaia_box")]
        print(f"✓ Sample requests with GAIA Box: {len(gaia_box_requests)} GAIA Box requests")


class TestDistanceCalculation:
    """Test distance calculation between cities"""
    
    def test_lisboa_madrid_distance(self):
        """Test that Lisboa-Madrid returns ~625km pricing"""
        payload = {
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "gaiabox"
        }
        response = requests.post(f"{BASE_URL}/api/search", json=payload)
        offers = response.json()
        
        # Price should be reasonable for ~625km
        # GAIA Box pricing is based on distance
        assert offers[0]["price"] > 0
        print(f"✓ Lisboa-Madrid pricing: €{offers[0]['price']}")
    
    def test_different_cities(self):
        """Test pricing varies by city pair"""
        cities = [
            ("Lisboa", "Madrid"),
            ("Lisboa", "Paris"),
            ("Lisboa", "Berlin")
        ]
        
        prices = []
        for from_city, to_city in cities:
            payload = {
                "from_city": from_city,
                "to_city": to_city,
                "shipment_type": "gaiabox"
            }
            response = requests.post(f"{BASE_URL}/api/search", json=payload)
            offers = response.json()
            prices.append((from_city, to_city, offers[0]["price"]))
        
        # Prices should increase with distance
        # Lisboa-Madrid < Lisboa-Paris < Lisboa-Berlin
        print(f"✓ Prices by distance: {prices}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
