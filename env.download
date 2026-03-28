import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, Box, Layers, Car, Home as HomeIcon, Search, Truck, Crown, ChevronRight, Plus, Minus, CheckCircle, Route, Check } from 'lucide-react';
import { calculateGaiaPrice, getDistance, GAIA_UI, GAIA_BOX_UI, GAIA_PALLET_UI, GAIA_MOVING_UI, GAIA_CTA } from '../utils/pricing';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SHIPMENT_TYPES = [
  { id: 'gaiabox', label: 'GAIA Box', icon: Box, color: '#4ECDC4' },
  { id: 'pallet', label: 'Pallet', icon: Layers, color: '#FFB347' },
  { id: 'vehicle', label: 'Vehicle', icon: Car, color: '#7B68EE' },
  { id: 'volume', label: 'Moving', icon: HomeIcon, color: '#FF6B9D' },
];

const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'Motorcycle' },
  { id: 'car', label: 'Car' },
  { id: 'suv', label: 'SUV' },
  { id: 'van', label: 'Van' },
];

// Load types for Pallet - NO URGENT
const PALLET_LOAD_TYPES = [
  { id: 'partial', label: 'Partial', modifier: '×0.90' },
  { id: 'standard', label: 'Standard', modifier: '×1.00' },
  { id: 'full', label: 'Full', modifier: '×1.10' },
];

// Handling options for Moving - NO HEAVY (multi-select, cumulative)
const MOVING_HANDLING_OPTIONS = [
  { id: 'stairs', label: 'Stairs', modifier: '+10%' },
  { id: 'fragile', label: 'Fragile Items', modifier: '+15%' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [shipmentType, setShipmentType] = useState('gaiabox');

  // GAIA Box state
  const [smallBoxQty, setSmallBoxQty] = useState(0);
  const [mediumBoxQty, setMediumBoxQty] = useState(0);
  const [largeBoxQty, setLargeBoxQty] = useState(0);

  // Pallet state
  const [palletQty, setPalletQty] = useState(1);
  const [palletWeight, setPalletWeight] = useState(500);
  const [loadType, setLoadType] = useState('standard');

  // Vehicle state
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleQty, setVehicleQty] = useState(1);

  // Moving state
  const [movingBoxes, setMovingBoxes] = useState(10);
  const [largeItems, setLargeItems] = useState(3);
  const [movingHandling, setMovingHandling] = useState([]); // Multi-select: ['stairs', 'fragile']

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try { const res = await fetch(`${API_URL}/api/stats`); setStats(await res.json()); } catch (e) {}
  };

  const distance = getDistance(fromCity, toCity);

  const isFormValid = () => {
    if (!fromCity.trim() || !toCity.trim()) return false;
    switch (shipmentType) {
      case 'gaiabox': return (smallBoxQty + mediumBoxQty + largeBoxQty) > 0;
      case 'pallet': return palletQty > 0;
      case 'vehicle': return vehicleQty > 0;
      case 'volume': return (movingBoxes > 0 || largeItems > 0);
      default: return false;
    }
  };

  const toggleHandling = (option) => {
    setMovingHandling(prev => 
      prev.includes(option) 
        ? prev.filter(h => h !== option)
        : [...prev, option]
    );
  };

  const getEstimate = () => {
    if (!distance) return null;
    try {
      switch (shipmentType) {
        case 'gaiabox': {
          return calculateGaiaPrice('gaiabox', { 
            smallQty: smallBoxQty, 
            mediumQty: mediumBoxQty, 
            largeQty: largeBoxQty,
            distanceKm: distance
          });
        }
        case 'pallet':
          return calculateGaiaPrice('pallet', { 
            distanceKm: distance, 
            palletQty: palletQty,
            weightKg: palletWeight,
            loadType: loadType
          });
        case 'vehicle':
          return calculateGaiaPrice('vehicle', { 
            distanceKm: distance, 
            vehicleType, 
            quantity: vehicleQty 
          });
        case 'volume':
          return calculateGaiaPrice('moving', { 
            boxes: movingBoxes, 
            largeItems,
            handling: movingHandling
          });
        default: return null;
      }
    } catch { return null; }
  };

  const handleSearch = () => {
    if (!isFormValid()) return;
    const shipmentData = {
      shipmentType,
      fromCity, toCity, distance,
      // GAIA Box
      smallBoxQty, mediumBoxQty, largeBoxQty,
      // Pallet
      palletQty, palletWeight, loadType,
      // Vehicle
      vehicleType, vehicleQty,
      // Moving
      movingBoxes, largeItems, 
      handling: movingHandling
    };
    navigate(`/results?data=${encodeURIComponent(JSON.stringify(shipmentData))}`);
  };

  const estimate = getEstimate();

  const QtyBtn = ({ value, onChange, min = 0, max = 99 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button style={btnStyle} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}><Minus size={14} /></button>
      <span style={{ width: 28, textAlign: 'center', fontWeight: 600 }}>{value}</span>
      <button style={btnStyle} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={14} /></button>
    </div>
  );

  return (
    <div className="app-container">
      {/* Premium Hero Section */}
      <div className="hero-section">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-logo">GAIA</div>
          <div className="hero-tagline">Smart Logistics Platform</div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-title">Find Capacity</div>
        <div className="input-group"><div className="input-icon"><MapPin size={20} color="#4A90E2" /></div><input placeholder="From (City)" value={fromCity} onChange={e => setFromCity(e.target.value)} /></div>
        <div className="input-group"><div className="input-icon"><Navigation size={20} color="#4AE24A" /></div><input placeholder="To (City)" value={toCity} onChange={e => setToCity(e.target.value)} /></div>
        {distance > 0 && (
          <div style={{ fontSize: 12, color: '#6B7B8F', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: 'rgba(74,144,226,0.15)', padding: '2px 8px', borderRadius: 4, color: '#4A90E2', fontWeight: 500 }}>Estimated</span>
            Distance: ~{distance} km
          </div>
        )}

        <div className="section-label">Shipment Type</div>
        <div className="shipment-types">
          {SHIPMENT_TYPES.map(t => {
            const Icon = t.icon; const active = shipmentType === t.id;
            return (
              <div key={t.id} className={`shipment-type-btn ${active ? 'active' : ''}`} style={active ? { borderColor: t.color } : {}} onClick={() => setShipmentType(t.id)}>
                <div className="shipment-icon-container" style={active ? { backgroundColor: `${t.color}20` } : {}}><Icon size={24} color={active ? t.color : '#6B7B8F'} /></div>
                <div className="shipment-type-label" style={active ? { color: t.color } : {}}>{t.label}</div>
              </div>
            );
          })}
        </div>

        {shipmentType === 'gaiabox' && (
          <div className="details-section">
            <div className="details-title">{GAIA_BOX_UI.title}</div>
            <div style={{ fontSize: 12, color: '#6B7B8F', marginBottom: 16 }}>{GAIA_BOX_UI.subtitle}</div>
            {GAIA_BOX_UI.options.map((opt, i) => {
              const val = i === 0 ? smallBoxQty : i === 1 ? mediumBoxQty : largeBoxQty;
              const setVal = i === 0 ? setSmallBoxQty : i === 1 ? setMediumBoxQty : setLargeBoxQty;
              return (
                <Row key={opt.name} label={opt.name} sub={`${opt.description} · ${opt.priceRange}`} tag={opt.tag}>
                  <QtyBtn value={val} onChange={setVal} />
                </Row>
              );
            })}
            {(smallBoxQty + mediumBoxQty + largeBoxQty) > 0 && distance > 0 && (
              <div className="route-block">
                <div className="route-block-header"><Route size={16} color="#4ECDC4" /><span>{GAIA_BOX_UI.routeBlock.title}</span></div>
                <div className="route-block-desc">{GAIA_BOX_UI.routeBlock.description}</div>
              </div>
            )}
          </div>
        )}

        {shipmentType === 'pallet' && (
          <div className="details-section">
            <div className="details-title">{GAIA_PALLET_UI.title}</div>
            <div style={{ fontSize: 12, color: '#6B7B8F', marginBottom: 16 }}>{GAIA_PALLET_UI.subtitle}</div>
            <Row label={GAIA_PALLET_UI.fields.pallets}><QtyBtn value={palletQty} onChange={setPalletQty} min={1} max={33} /></Row>
            <Row label={GAIA_PALLET_UI.fields.weight}><input type="number" className="small-input" value={palletWeight} onChange={e => setPalletWeight(+e.target.value)} style={{ width: 80 }} /></Row>
            <Row label="Load Type">
              <select className="small-input" value={loadType} onChange={e => setLoadType(e.target.value)} style={{ width: 110 }}>
                {PALLET_LOAD_TYPES.map(lt => (
                  <option key={lt.id} value={lt.id}>{lt.label} ({lt.modifier})</option>
                ))}
              </select>
            </Row>
            {palletQty > 0 && distance > 0 && (
              <div className="route-block">
                <div className="route-block-header"><Route size={16} color="#FFB347" /><span>{GAIA_PALLET_UI.routeBlock.title}</span></div>
                <div className="route-block-desc">{GAIA_PALLET_UI.routeBlock.description}</div>
              </div>
            )}
          </div>
        )}

        {shipmentType === 'vehicle' && (
          <div className="details-section">
            <div className="details-title">Vehicle Transport</div>
            <div style={{ fontSize: 12, color: '#6B7B8F', marginBottom: 16 }}>Market rate: €0.50/km · GAIA: 15% discount</div>
            <Row label="Type">
              <select className="small-input" value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ width: 100 }}>
                {VEHICLE_TYPES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </Row>
            <Row label="Quantity"><QtyBtn value={vehicleQty} onChange={setVehicleQty} min={1} max={10} /></Row>
          </div>
        )}

        {shipmentType === 'volume' && (
          <div className="details-section">
            <div className="details-title">{GAIA_MOVING_UI.title}</div>
            <div style={{ fontSize: 12, color: '#6B7B8F', marginBottom: 16 }}>{GAIA_MOVING_UI.subtitle}</div>
            <div className="moving-features">
              {GAIA_MOVING_UI.features.map((f, i) => (
                <div key={i} className="moving-feature"><CheckCircle size={14} color="#4AE24A" /><span>{f}</span></div>
              ))}
            </div>
            <Row label={GAIA_MOVING_UI.fields.boxes} sub="€10 each"><QtyBtn value={movingBoxes} onChange={setMovingBoxes} /></Row>
            <Row label={GAIA_MOVING_UI.fields.largeItems} sub="€80 each"><QtyBtn value={largeItems} onChange={setLargeItems} /></Row>
            
            {/* Multi-select handling options */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#fff', marginBottom: 10, fontWeight: 500 }}>Handling Conditions (cumulative)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {MOVING_HANDLING_OPTIONS.map(opt => {
                  const isSelected = movingHandling.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleHandling(opt.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #4ECDC4' : '1px solid #2A3A4E',
                        background: isSelected ? 'rgba(78,205,196,0.15)' : '#0F1C2E',
                        color: isSelected ? '#4ECDC4' : '#6B7B8F',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      {opt.label} <span style={{ opacity: 0.7 }}>({opt.modifier})</span>
                    </button>
                  );
                })}
              </div>
              {movingHandling.length > 0 && (
                <div style={{ fontSize: 11, color: '#4AE24A', marginTop: 8 }}>
                  Total adjustment: +{movingHandling.reduce((sum, h) => sum + (h === 'stairs' ? 10 : 15), 0)}%
                </div>
              )}
            </div>

            {(movingBoxes > 0 || largeItems > 0) && (
              <div className="route-block" style={{ marginTop: 16 }}>
                <div className="route-block-header"><Route size={16} color="#FF6B9D" /><span>{GAIA_MOVING_UI.routeBlock.title}</span></div>
                <div className="route-block-desc">{GAIA_MOVING_UI.routeBlock.description}</div>
              </div>
            )}
          </div>
        )}

        {estimate && (
          <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74,226,74,0.2)', borderRadius: 12, padding: 16, marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6B7B8F' }}>Estimated</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4AE24A' }}>€{estimate.min} – €{estimate.max}</div>
          </div>
        )}

        <button className="search-btn" onClick={handleSearch} disabled={!isFormValid()} data-testid="find-capacity-btn"><Search size={20} /> {GAIA_UI.buttonPrimary}</button>
      </div>

      <div className="bottom-buttons">
        <Link to="/transporter" className="transporter-btn" data-testid="transporter-btn"><div className="transporter-icon"><Truck size={22} color="#4A90E2" /></div><div className="transporter-content"><div className="transporter-title">{GAIA_CTA.transporter.title}</div><div className="transporter-subtitle">{GAIA_CTA.transporter.subtitle}</div></div><ChevronRight size={18} color="#6B7B8F" /></Link>
        <Link to="/pricing" className="join-network-btn" data-testid="join-network-btn"><div className="join-network-icon"><Crown size={22} color="#FFD700" /></div><div className="transporter-content"><div className="join-network-title">{GAIA_CTA.network.title}</div><div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>{GAIA_CTA.network.subtitle}</div></div><ChevronRight size={18} color="#6B7B8F" /></Link>
      </div>
    </div>
  );
}

const btnStyle = { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#0F1C2E', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const Row = ({ label, sub, tag, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2A3A4E' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500, color: '#fff', fontSize: 14 }}>{label}</span>
        {tag && <span style={{ fontSize: 10, color: '#4ECDC4', background: 'rgba(78,205,196,0.15)', padding: '2px 6px', borderRadius: 4 }}>{tag}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#6B7B8F' }}>{sub}</div>}
    </div>
    {children}
  </div>
);
