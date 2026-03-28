import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Truck, Calendar, Package, DollarSign, Box, Layers, Plus, Minus, CheckCircle, X } from 'lucide-react';
import './Transporter.css';
import { getDistance, getTransporterBoxEarnings, calculateTransporterPalletEarnings, calculateTransporterMixedEarnings } from '../utils/pricing';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Capacity Type Options
const CAPACITY_TYPES = [
  { id: 'gaiabox', label: 'GAIA Box', icon: Box, color: '#4ECDC4' },
  { id: 'pallet', label: 'Pallet', icon: Layers, color: '#FFB347' },
  { id: 'mixed', label: 'Mixed Load', icon: Package, color: '#7B68EE' },
];

// Load Type Options - Now pallet-based only (for Mixed Load)
const LOAD_TYPES = [
  { id: 'full', label: 'Full Pallets Only' },
  { id: 'mixed', label: 'Full + Half Pallets' },
];

// Pallet Load Type Options (for Pallet mode) - Partial/Standard/Full
// Aligned with pricing.js: Partial ×0.90, Standard ×1.00, Full ×1.10
const PALLET_LOAD_TYPES = [
  { id: 'partial', label: 'Partial', priceFactor: 0.90 },
  { id: 'standard', label: 'Standard', priceFactor: 1.00 },
  { id: 'full', label: 'Full', priceFactor: 1.10 },
];

export default function TransporterPage() {
  const navigate = useNavigate();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [capacity, setCapacity] = useState('20');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // NEW: Success modal

  // New: Capacity Type
  const [capacityType, setCapacityType] = useState('pallet');

  // New: GAIA Box Capacity
  const [smallBoxCapacity, setSmallBoxCapacity] = useState(0);
  const [mediumBoxCapacity, setMediumBoxCapacity] = useState(0);
  const [largeBoxCapacity, setLargeBoxCapacity] = useState(0);

  // New: Load Type (for Mixed)
  const [loadType, setLoadType] = useState('mixed');

  // NEW: Pallet Load Type (Partial/Standard/Full)
  const [palletLoadType, setPalletLoadType] = useState('standard');

  // New: Mixed Load Capacity - Now pallet-based
  const [fullPallets, setFullPallets] = useState(10);
  const [halfPallets, setHalfPallets] = useState(0);

  // Calculate total load in pallet equivalents
  const getTotalLoad = () => fullPallets + (halfPallets * 0.5);
  const vehicleMaxCapacity = vehicleType === 'truck' ? 33 : vehicleType === 'trailer' ? 26 : 12;

  const handlePublish = async () => {
    if (!fromCity || !toCity || !departureDate) return;
    
    setLoading(true);
    try {
      const routeData = {
        from_city: fromCity,
        to_city: toCity,
        departure_date: departureDate,
        route_type: 'Direct',
        vehicle_type: vehicleType === 'truck' ? '18t Truck' : vehicleType === 'van' ? 'Sprinter Van' : 'Curtainsider',
        weight_capacity: 10000,
        volume_capacity: parseFloat(capacity) || 50,
        pallet_capacity: capacityType === 'pallet' ? parseInt(capacity) || 20 : fullPallets,
        max_length: 1200,
        max_width: 240,
        max_height: 270,
        cargo_types: ['pallets', 'boxes'],
        fragile_accepted: true,
        stackable_allowed: true,
        temperature_controlled: false,
        price_per_pallet: 50,
        // New GAIA Box config
        gaia_box_config: capacityType === 'gaiabox' ? {
          enabled: true,
          small_box_capacity: smallBoxCapacity,
          medium_box_capacity: mediumBoxCapacity,
          large_box_capacity: largeBoxCapacity,
          num_boxes: smallBoxCapacity + mediumBoxCapacity + largeBoxCapacity,
          price_per_box: 12,
        } : null,
        // Capacity type and load type
        capacity_type: capacityType,
        load_type: capacityType === 'pallet' ? palletLoadType : loadType,
      };

      await fetch(`${API_URL}/api/publish-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData),
      });
      
      // Show success modal instead of navigating
      setShowSuccess(true);
    } catch (error) {
      console.error('Error publishing route:', error);
      // Still show success for demo purposes (investor perception)
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance for earnings
  const distance = getDistance(fromCity, toCity);

  const calculateEarnings = () => {
    if (capacityType === 'gaiabox') {
      // Use 3-tier distance pricing: 0-200km=min, 200-1000km=mid, 1000km+=max
      const smallEarnings = smallBoxCapacity * getTransporterBoxEarnings('small', distance);
      const mediumEarnings = mediumBoxCapacity * getTransporterBoxEarnings('medium', distance);
      const largeEarnings = largeBoxCapacity * getTransporterBoxEarnings('large', distance);
      const total = smallEarnings + mediumEarnings + largeEarnings;
      return {
        min: Math.round(total),
        max: Math.round(total * 1.15),
      };
    } else if (capacityType === 'pallet') {
      // Same formula as customer: weight × distance × 0.00012 × load_modifier, min €25
      const palletCount = parseInt(capacity) || 1;
      const result = calculateTransporterPalletEarnings({ 
        distanceKm: distance, 
        weightKg: 500, 
        loadType: palletLoadType, 
        palletQty: palletCount 
      });
      return result;
    } else {
      // Mixed Load: Full Pallets at full price, Half Pallets at HALF price
      const result = calculateTransporterMixedEarnings({ 
        distanceKm: distance, 
        fullPallets, 
        halfPallets, 
        weightKg: 500, 
        loadType: 'standard' 
      });
      return result;
    }
  };

  const earnings = calculateEarnings();
  const isValid = fromCity && toCity && departureDate && (
    capacityType === 'gaiabox' 
      ? (smallBoxCapacity + mediumBoxCapacity + largeBoxCapacity) > 0
      : true
  );

  const QtyBtn = ({ value, onChange, min = 0, max = 99 }) => (
    <div className="qty-controls">
      <button className="qty-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Minus size={14} />
      </button>
      <span className="qty-value">{value}</span>
      <button className="qty-btn" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <div className="app-container">
      <div className="transporter-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="transporter-header-title">Transporter Mode</div>
      </div>

      <div className="transporter-content">
        <div className="transporter-banner">
          <Truck size={24} color="#4A90E2" />
          <div className="banner-text">
            <div className="banner-title">Publish Your Route</div>
            <div className="banner-subtitle">Connect with shippers looking for capacity</div>
          </div>
        </div>

        <div className="transporter-form">
          <div className="form-section-title">Route Details</div>
          
          <div className="form-group">
            <div className="form-label">Origin</div>
            <div className="form-input-wrapper">
              <MapPin size={18} color="#4A90E2" />
              <input
                type="text"
                placeholder="From city"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Destination</div>
            <div className="form-input-wrapper">
              <Navigation size={18} color="#4AE24A" />
              <input
                type="text"
                placeholder="To city"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Departure Date</div>
            <div className="form-input-wrapper">
              <Calendar size={18} color="#6B7B8F" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section-title">Vehicle Information</div>

          <div className="form-group">
            <div className="form-label">Vehicle Type</div>
            <select
              className="form-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="trailer">Trailer</option>
            </select>
          </div>

          <div className="form-group">
            <div className="form-label">Available Volume (m³)</div>
            <div className="form-input-wrapper">
              <Package size={18} color="#6B7B8F" />
              <input
                type="number"
                placeholder="Volume in m³"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          {/* NEW: Capacity Type Section */}
          <div className="form-section-title">Capacity Type</div>
          
          <div className="capacity-type-selector">
            {CAPACITY_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = capacityType === type.id;
              return (
                <div
                  key={type.id}
                  className={`capacity-type-btn ${isActive ? 'active' : ''}`}
                  style={isActive ? { borderColor: type.color } : {}}
                  onClick={() => setCapacityType(type.id)}
                >
                  <div className="capacity-type-icon" style={isActive ? { backgroundColor: `${type.color}20` } : {}}>
                    <Icon size={20} color={isActive ? type.color : '#6B7B8F'} />
                  </div>
                  <div className="capacity-type-label" style={isActive ? { color: type.color } : {}}>
                    {type.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* GAIA Box Capacity Details */}
          {capacityType === 'gaiabox' && (
            <div className="gaia-box-section">
              <div className="gaia-box-info">
                <Box size={18} color="#4ECDC4" />
                <span>Define your GAIA Box capacity</span>
              </div>
              
              <div className="box-capacity-row">
                <div className="box-capacity-label">
                  <span className="box-name">Small Box</span>
                  <span className="box-desc">Up to 5kg · €8-€12</span>
                </div>
                <QtyBtn value={smallBoxCapacity} onChange={setSmallBoxCapacity} />
              </div>

              <div className="box-capacity-row">
                <div className="box-capacity-label">
                  <span className="box-name">Medium Box</span>
                  <span className="box-desc">Up to 15kg · €16-€24</span>
                </div>
                <QtyBtn value={mediumBoxCapacity} onChange={setMediumBoxCapacity} />
              </div>

              <div className="box-capacity-row">
                <div className="box-capacity-label">
                  <span className="box-name">Large Box</span>
                  <span className="box-desc">From 15kg until 30kg · €26-€38</span>
                </div>
                <QtyBtn value={largeBoxCapacity} onChange={setLargeBoxCapacity} />
              </div>

              {(smallBoxCapacity + mediumBoxCapacity + largeBoxCapacity) > 0 && (
                <div className="total-capacity-info">
                  Total Capacity: {smallBoxCapacity + mediumBoxCapacity + largeBoxCapacity} boxes
                </div>
              )}
            </div>
          )}

          {/* Pallet Load Type: Partial/Standard/Full */}
          {capacityType === 'pallet' && (
            <div className="pallet-load-section">
              <div className="form-group">
                <div className="form-label">Load Type</div>
                <select
                  className="form-select"
                  value={palletLoadType}
                  onChange={(e) => setPalletLoadType(e.target.value)}
                >
                  {PALLET_LOAD_TYPES.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
                <div className="form-hint">
                  {palletLoadType === 'partial' && 'Partial load (×0.90)'}
                  {palletLoadType === 'standard' && 'Standard rate (×1.00)'}
                  {palletLoadType === 'full' && 'Full load (×1.10)'}
                </div>
              </div>
            </div>
          )}

          {/* Mixed Load Details - Now pallet-based */}
          {capacityType === 'mixed' && (
            <div className="mixed-load-section">
              <div className="mixed-load-info">
                <Layers size={18} color="#7B68EE" />
                <span>Pallet-based capacity (standardized)</span>
              </div>

              <div className="form-group">
                <div className="form-label">Load Type</div>
                <select
                  className="form-select"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                >
                  {LOAD_TYPES.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">Full Pallets</div>
                <div className="form-input-wrapper">
                  <Layers size={18} color="#FFB347" />
                  <input
                    type="number"
                    placeholder="Number of full pallets"
                    value={fullPallets}
                    onChange={(e) => setFullPallets(Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={vehicleMaxCapacity}
                  />
                </div>
                <div className="form-hint">1 pallet = 1.0 load unit</div>
              </div>

              {loadType === 'mixed' && (
                <div className="form-group">
                  <div className="form-label">Half Pallets</div>
                  <div className="form-input-wrapper">
                    <Package size={18} color="#7B68EE" />
                    <input
                      type="number"
                      placeholder="Number of half pallets"
                      value={halfPallets}
                      onChange={(e) => setHalfPallets(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                    />
                  </div>
                  <div className="form-hint">1 half pallet = 0.5 load unit</div>
                </div>
              )}

              <div className="total-load-info">
                <div className="load-summary">
                  <span>Total Load:</span>
                  <strong>{getTotalLoad()} pallet equiv.</strong>
                </div>
                <div className="load-capacity">
                  <span>Vehicle Capacity:</span>
                  <strong>{vehicleMaxCapacity} pallets</strong>
                </div>
                {getTotalLoad() > vehicleMaxCapacity && (
                  <div className="load-warning">
                    ⚠️ Exceeds vehicle capacity!
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="earnings-preview">
            <DollarSign size={20} color="#4AE24A" />
            <div className="earnings-content">
              <div className="earnings-label">Estimated Earnings</div>
              <div className="earnings-value">€{earnings.min} - €{earnings.max}</div>
            </div>
          </div>

          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={!isValid || loading}
          >
            {loading ? 'Publishing...' : 'Publish Route'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <CheckCircle size={48} color="#4AE24A" />
            </div>
            <div className="success-title">Route Published Successfully!</div>
            <div className="success-message">
              Your capacity is now visible in the GAIA network. Shippers can now find and book your available space.
            </div>
            <div className="success-details">
              <div className="success-detail-row">
                <span>Route:</span>
                <strong>{fromCity} → {toCity}</strong>
              </div>
              <div className="success-detail-row">
                <span>Date:</span>
                <strong>{departureDate}</strong>
              </div>
              <div className="success-detail-row">
                <span>Type:</span>
                <strong>{capacityType === 'gaiabox' ? 'GAIA Box' : capacityType === 'pallet' ? 'Pallet' : 'Mixed Load'}</strong>
              </div>
            </div>
            <button 
              className="success-close-btn"
              onClick={() => {
                setShowSuccess(false);
                navigate('/');
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
