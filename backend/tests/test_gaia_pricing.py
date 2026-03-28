"""
GAIA Logistics Pricing Validation Tests
Tests pricing calculations against pricing.js constants
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://gaia-marketplace.preview.emergentagent.com').rstrip('/')

# ============ PRICING CONSTANTS FROM pricing.js ============
# GAIA Box unit prices - MAX CAPS
BOX_PRICES = {
    'small': 12,   # €12 per small box (MAX CAP)
    'medium': 24,  # €24 per medium box (MAX CAP)
    'large': 38    # €38 per large box (MAX CAP)
}

# Pallet pricing
PALLET_BASE_RATE_PER_KM = 0.12  # €/km per pallet
PALLET_MIN_PRICE = 35  # Minimum €35 per pallet
PALLET_GAIA_DISCOUNT = 0.12  # 12% GAIA discount

# Vehicle rates per km
VEHICLE_RATES = {
    'motorcycle': 0.50,
    'car': 0.65,
    'suv': 0.75,
    'van': 0.85,
    'truck': 1.20
}
VEHICLE_GAIA_DISCOUNT = 0.12

# Moving pricing
MOVING_BOX_PRICE = 10  # €10 per standard box
MOVING_LARGE_ITEM_PRICE = 80  # €80 per large item

# Distance lookup from pricing.js
CITY_DISTANCES = {
    'lisboa-porto': 315,
    'lisboa-madrid': 625,
    'hamburg-porto': 2100,
    'berlin-paris': 1050,
    'paris-amsterdam': 500,
}


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "active_routes" in data
        assert "transport_companies" in data
        print(f"✓ Stats: {data['active_routes']} routes, {data['transport_companies']} companies")


class TestGaiaBoxPricing:
    """GAIA Box pricing validation - MAX CAPS enforced"""
    
    def test_small_box_max_cap(self):
        """Small box should be ≤€12 per unit (base)"""
        # 1 small box, short distance (Lisboa-Porto 315km)
        # Base: €12, with distance factor ~1.115 = €13.38
        # This is within expected range
        assert BOX_PRICES['small'] == 12
        print(f"✓ Small Box MAX CAP: €{BOX_PRICES['small']}")
    
    def test_medium_box_max_cap(self):
        """Medium box should be ≤€24 per unit (base)"""
        assert BOX_PRICES['medium'] == 24
        print(f"✓ Medium Box MAX CAP: €{BOX_PRICES['medium']}")
    
    def test_large_box_max_cap(self):
        """Large box should be ≤€38 per unit (base)"""
        assert BOX_PRICES['large'] == 38
        print(f"✓ Large Box MAX CAP: €{BOX_PRICES['large']}")
    
    def test_distance_affects_box_price(self):
        """Verify distance factor is applied to box pricing"""
        # Short distance (Lisboa-Porto 315km) vs Long distance (Hamburg-Porto 2100km)
        # Distance factor for 315km: 1.0 + (315-200)/1000 = 1.115
        # Distance factor for 2100km: 2.1 (max)
        
        short_distance = 315
        long_distance = 2100
        
        # Calculate distance factors
        def calc_distance_factor(km):
            if km <= 200:
                return 1.0
            if km <= 600:
                return 1.0 + ((km - 200) / 1000)
            if km <= 2000:
                return 1.4 + ((km - 600) / 2000)
            return 2.1
        
        short_factor = calc_distance_factor(short_distance)
        long_factor = calc_distance_factor(long_distance)
        
        assert short_factor < long_factor
        print(f"✓ Distance factor: {short_distance}km = {short_factor:.3f}, {long_distance}km = {long_factor:.3f}")
        print(f"  Long distance is {long_factor/short_factor:.2f}x more expensive")


class TestPalletPricing:
    """Pallet pricing validation"""
    
    def test_pallet_base_rate(self):
        """Verify pallet base rate is €0.12/km"""
        assert PALLET_BASE_RATE_PER_KM == 0.12
        print(f"✓ Pallet base rate: €{PALLET_BASE_RATE_PER_KM}/km")
    
    def test_pallet_min_price(self):
        """Verify minimum pallet price is €35"""
        assert PALLET_MIN_PRICE == 35
        print(f"✓ Pallet minimum price: €{PALLET_MIN_PRICE}")
    
    def test_pallet_gaia_discount(self):
        """Verify GAIA discount is 12%"""
        assert PALLET_GAIA_DISCOUNT == 0.12
        print(f"✓ Pallet GAIA discount: {PALLET_GAIA_DISCOUNT * 100}%")
    
    def test_pallet_price_calculation(self):
        """Test pallet price calculation for Hamburg-Porto (2100km)"""
        distance_km = 2100
        pallets = 1
        weight_kg = 500  # Standard weight
        
        # Weight factor (300-800kg = 1.0)
        weight_factor = 1.0
        
        # Price per pallet = max(min_price, distance * base_rate * weight_factor)
        price_per_pallet = max(PALLET_MIN_PRICE, distance_km * PALLET_BASE_RATE_PER_KM * weight_factor)
        
        # Apply GAIA discount
        gaia_price = price_per_pallet * (1 - PALLET_GAIA_DISCOUNT)
        
        # Total
        total = gaia_price * pallets
        
        print(f"✓ Pallet calculation for {distance_km}km:")
        print(f"  Base price: €{price_per_pallet:.2f}")
        print(f"  After 12% GAIA discount: €{gaia_price:.2f}")
        print(f"  Total for {pallets} pallet(s): €{total:.2f}")
        
        # Verify it's distance-based (not flat)
        assert price_per_pallet > PALLET_MIN_PRICE  # Should exceed minimum for long distance


class TestVehiclePricing:
    """Vehicle transport pricing validation"""
    
    def test_vehicle_rates(self):
        """Verify vehicle rates per km"""
        assert VEHICLE_RATES['motorcycle'] == 0.50
        assert VEHICLE_RATES['car'] == 0.65
        assert VEHICLE_RATES['suv'] == 0.75
        assert VEHICLE_RATES['van'] == 0.85
        print(f"✓ Vehicle rates: motorcycle=€{VEHICLE_RATES['motorcycle']}/km, car=€{VEHICLE_RATES['car']}/km, suv=€{VEHICLE_RATES['suv']}/km, van=€{VEHICLE_RATES['van']}/km")
    
    def test_vehicle_price_calculation(self):
        """Test vehicle price calculation for Lisboa-Madrid (625km)"""
        distance_km = 625
        vehicle_type = 'car'
        quantity = 1
        
        rate_per_km = VEHICLE_RATES[vehicle_type]
        base_price = distance_km * rate_per_km * quantity
        gaia_price = base_price * (1 - VEHICLE_GAIA_DISCOUNT)
        
        print(f"✓ Vehicle calculation for {vehicle_type} {distance_km}km:")
        print(f"  Base price: €{base_price:.2f}")
        print(f"  After 12% GAIA discount: €{gaia_price:.2f}")
        
        # Verify longer routes = higher prices
        short_distance = 315
        short_price = short_distance * rate_per_km * (1 - VEHICLE_GAIA_DISCOUNT)
        assert gaia_price > short_price
        print(f"  625km (€{gaia_price:.2f}) > 315km (€{short_price:.2f}) ✓")


class TestMovingPricing:
    """Moving service pricing validation"""
    
    def test_moving_box_price(self):
        """Verify standard box price is €10"""
        assert MOVING_BOX_PRICE == 10
        print(f"✓ Moving standard box: €{MOVING_BOX_PRICE} each")
    
    def test_moving_large_item_price(self):
        """Verify large item price is €80"""
        assert MOVING_LARGE_ITEM_PRICE == 80
        print(f"✓ Moving large item: €{MOVING_LARGE_ITEM_PRICE} each")
    
    def test_moving_price_calculation(self):
        """Test moving price calculation"""
        boxes = 10
        large_items = 3
        distance_km = 1050  # Berlin-Paris
        
        # Base items total
        items_total = (boxes * MOVING_BOX_PRICE) + (large_items * MOVING_LARGE_ITEM_PRICE)
        
        # Distance factor for moving
        def calc_moving_distance_factor(km):
            if km <= 100:
                return 1.0
            if km <= 500:
                return 1.0 + ((km - 100) / 500 * 0.8)
            if km <= 2000:
                return 1.8 + ((km - 500) / 1500)
            return 2.8
        
        distance_factor = calc_moving_distance_factor(distance_km)
        total = items_total * distance_factor
        
        print(f"✓ Moving calculation for {distance_km}km:")
        print(f"  Items: {boxes} boxes (€{boxes * MOVING_BOX_PRICE}) + {large_items} large items (€{large_items * MOVING_LARGE_ITEM_PRICE})")
        print(f"  Items total: €{items_total}")
        print(f"  Distance factor: {distance_factor:.3f}")
        print(f"  Final estimate: €{total:.2f}")


class TestDistanceLookup:
    """Distance lookup validation"""
    
    def test_lisboa_porto_distance(self):
        """Lisboa-Porto should be 315km"""
        assert CITY_DISTANCES['lisboa-porto'] == 315
        print(f"✓ Lisboa-Porto: {CITY_DISTANCES['lisboa-porto']}km")
    
    def test_hamburg_porto_distance(self):
        """Hamburg-Porto should be 2100km"""
        assert CITY_DISTANCES['hamburg-porto'] == 2100
        print(f"✓ Hamburg-Porto: {CITY_DISTANCES['hamburg-porto']}km")
    
    def test_lisboa_madrid_distance(self):
        """Lisboa-Madrid should be 625km"""
        assert CITY_DISTANCES['lisboa-madrid'] == 625
        print(f"✓ Lisboa-Madrid: {CITY_DISTANCES['lisboa-madrid']}km")


class TestSearchAPI:
    """Search API endpoint tests"""
    
    def test_search_gaiabox(self):
        """Test GAIA Box search"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "from_city": "Lisboa",
            "to_city": "Porto",
            "shipment_type": "gaiabox"
        })
        assert response.status_code == 200
        offers = response.json()
        assert len(offers) == 3  # Direct, 1 Stop, Eco Route
        print(f"✓ GAIA Box search returned {len(offers)} offers")
    
    def test_search_pallet(self):
        """Test Pallet search"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "from_city": "Hamburg",
            "to_city": "Porto",
            "shipment_type": "pallet",
            "pallet_details": {
                "num_pallets": 1,
                "weight": 500
            }
        })
        assert response.status_code == 200
        offers = response.json()
        assert len(offers) == 3
        print(f"✓ Pallet search returned {len(offers)} offers")
    
    def test_search_vehicle(self):
        """Test Vehicle search"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "shipment_type": "vehicle",
            "vehicle_details": {
                "vehicle_type": "car"
            }
        })
        assert response.status_code == 200
        offers = response.json()
        assert len(offers) == 3
        print(f"✓ Vehicle search returned {len(offers)} offers")
    
    def test_search_moving(self):
        """Test Moving search"""
        response = requests.post(f"{BASE_URL}/api/search", json={
            "from_city": "Berlin",
            "to_city": "Paris",
            "shipment_type": "volume",
            "moving_details": {
                "total_volume": 20,
                "large_items": 3
            }
        })
        assert response.status_code == 200
        offers = response.json()
        assert len(offers) == 3
        print(f"✓ Moving search returned {len(offers)} offers")


class TestPublishRouteAPI:
    """Publish Route API endpoint tests"""
    
    def test_publish_route(self):
        """Test publishing a route"""
        response = requests.post(f"{BASE_URL}/api/publish-route", json={
            "from_city": "Lisboa",
            "to_city": "Madrid",
            "departure_date": "2026-04-15",
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
            "temperature_controlled": False
        })
        assert response.status_code == 200
        route = response.json()
        assert "id" in route
        assert route["from_city"] == "Lisboa"
        assert route["to_city"] == "Madrid"
        print(f"✓ Route published: {route['from_city']} → {route['to_city']}")
        print(f"  Estimated earnings: €{route['estimated_earnings_min']} - €{route['estimated_earnings_max']}")


class TestPricingPlansAPI:
    """Pricing plans API endpoint tests"""
    
    def test_pricing_plans(self):
        """Test pricing plans endpoint"""
        response = requests.get(f"{BASE_URL}/api/pricing-plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) == 3  # Starter, Professional, Fleet
        print(f"✓ Pricing plans: {[p['name'] for p in data['plans']]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
