import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, Box, Layers, Car, Home as HomeIcon, Search, Truck, Crown, ChevronRight, Plus, Minus, CheckCircle, Route, Check, Shield, ShieldCheck, Zap, Award, Star } from 'lucide-react';
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

  // Insurance state
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceType, setInsuranceType] = useState('standard');
  const [declaredValue, setDeclaredValue] = useState('');

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
      handling: movingHandling,
      // Insurance
      insurance_selected: insuranceEnabled,
      insurance_type: insuranceEnabled ? insuranceType : null,
      declared_goods_value: insuranceEnabled && declaredValue ? parseFloat(declaredValue) : null
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
      <div className="hero-section">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0A1628, #1A2A3E)' }} />
        <div className="hero-content"><div className="hero-logo">GAIA</div><div className="hero-tagline">Smart Logistics</div></div>
      </div>

      {stats && (
        <div className="stats-banner">
          <div className="stat-item"><div className="stat-value">{stats.active_routes?.toLocaleString()}+</div><div className="stat-label">Routes</div></div>
          <div className="stat-divider" />
          <div className="stat-item"><div className="stat-value">{stats.transport_companies?.toLocaleString()}+</div><div className="stat-label">Companies</div></div>
        </div>
      )}

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
          <div style={{ background: '#1A2A3E', borderRadius: 12, padding: 16, marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6B7B8F' }}>Estimated</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4AE24A' }}>€{estimate.min} – €{estimate.max}</div>
          </div>
        )}

        {/* Premium Insurance Section */}
        {isFormValid() && (
          <div className="insurance-premium-section" style={{ marginTop: 20 }}>
            {/* Insurance Toggle Header */}
            <div 
              className="insurance-toggle-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: insuranceEnabled 
                  ? 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(78,205,196,0.1))' 
                  : '#0F1C2E',
                border: insuranceEnabled ? '1px solid rgba(74,144,226,0.4)' : '1px solid #2A3A4E',
                borderRadius: insuranceEnabled ? '16px 16px 0 0' : 16,
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setInsuranceEnabled(!insuranceEnabled)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: insuranceEnabled ? 'rgba(74,144,226,0.2)' : 'rgba(107,123,143,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={22} color={insuranceEnabled ? '#4A90E2' : '#6B7B8F'} />
                </div>
                <div>
                  <div style={{ 
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: insuranceEnabled ? '#fff' : '#9BA8B9'
                  }}>
                    Cargo Insurance
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>
                    {insuranceEnabled ? 'Protection active' : 'Optional protection for your shipment'}
                  </div>
                </div>
              </div>
              <div style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: insuranceEnabled ? '#4A90E2' : '#2A3A4E',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: insuranceEnabled ? 27 : 3,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {/* Expanded Insurance Panel */}
            {insuranceEnabled && (
              <div style={{
                background: 'linear-gradient(180deg, rgba(15,28,46,0.95), #0F1C2E)',
                border: '1px solid rgba(74,144,226,0.4)',
                borderTop: 'none',
                borderRadius: '0 0 16px 16px',
                padding: '20px 18px',
                animation: 'slideDown 0.3s ease'
              }}>
                {/* Declared Value Input */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 13, 
                    color: '#9BA8B9', 
                    marginBottom: 8,
                    fontWeight: 500
                  }}>
                    Declared Cargo Value
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#0A1628',
                    borderRadius: 12,
                    border: '1px solid #2A3A4E',
                    overflow: 'hidden'
                  }}>
                    <span style={{ 
                      padding: '14px 16px', 
                      background: 'rgba(74,144,226,0.1)', 
                      color: '#4A90E2',
                      fontWeight: 600,
                      fontSize: 16
                    }}>€</span>
                    <input
                      type="number"
                      placeholder="Enter cargo value"
                      value={declaredValue}
                      onChange={e => setDeclaredValue(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        padding: '14px 16px',
                        color: '#fff',
                        fontSize: 15,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Insurance Package Selection */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 13, 
                    color: '#9BA8B9', 
                    marginBottom: 12,
                    fontWeight: 500
                  }}>
                    Select Coverage Package
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Basic Package */}
                    <div
                      onClick={() => setInsuranceType('basic')}
                      style={{
                        background: insuranceType === 'basic' 
                          ? 'linear-gradient(135deg, rgba(78,205,196,0.12), rgba(78,205,196,0.05))'
                          : '#0A1628',
                        border: insuranceType === 'basic' 
                          ? '2px solid #4ECDC4' 
                          : '1px solid #2A3A4E',
                        borderRadius: 14,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: insuranceType === 'basic' ? 'rgba(78,205,196,0.2)' : 'rgba(107,123,143,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Shield size={18} color={insuranceType === 'basic' ? '#4ECDC4' : '#6B7B8F'} />
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 600, 
                              color: insuranceType === 'basic' ? '#4ECDC4' : '#9BA8B9'
                            }}>Basic</div>
                            <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>
                              Essential coverage for standard shipments
                            </div>
                          </div>
                        </div>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          border: insuranceType === 'basic' ? '2px solid #4ECDC4' : '2px solid #3A4A5E',
                          background: insuranceType === 'basic' ? '#4ECDC4' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {insuranceType === 'basic' && <Check size={14} color="#0A1628" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>

                    {/* Standard Package */}
                    <div
                      onClick={() => setInsuranceType('standard')}
                      style={{
                        background: insuranceType === 'standard' 
                          ? 'linear-gradient(135deg, rgba(74,144,226,0.15), rgba(74,144,226,0.05))'
                          : '#0A1628',
                        border: insuranceType === 'standard' 
                          ? '2px solid #4A90E2' 
                          : '1px solid #2A3A4E',
                        borderRadius: 14,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {insuranceType === 'standard' && (
                        <div style={{
                          position: 'absolute',
                          top: -8,
                          right: 16,
                          background: '#4A90E2',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>Popular</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: insuranceType === 'standard' ? 'rgba(74,144,226,0.2)' : 'rgba(107,123,143,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Award size={18} color={insuranceType === 'standard' ? '#4A90E2' : '#6B7B8F'} />
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 600, 
                              color: insuranceType === 'standard' ? '#4A90E2' : '#9BA8B9'
                            }}>Standard</div>
                            <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>
                              Extended protection for higher-value cargo
                            </div>
                          </div>
                        </div>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          border: insuranceType === 'standard' ? '2px solid #4A90E2' : '2px solid #3A4A5E',
                          background: insuranceType === 'standard' ? '#4A90E2' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {insuranceType === 'standard' && <Check size={14} color="#fff" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>

                    {/* Premium Package */}
                    <div
                      onClick={() => setInsuranceType('premium')}
                      style={{
                        background: insuranceType === 'premium' 
                          ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,183,71,0.08))'
                          : '#0A1628',
                        border: insuranceType === 'premium' 
                          ? '2px solid #FFD700' 
                          : '1px solid #2A3A4E',
                        borderRadius: 14,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: insuranceType === 'premium' ? 'rgba(255,215,0,0.2)' : 'rgba(107,123,143,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Star size={18} color={insuranceType === 'premium' ? '#FFD700' : '#6B7B8F'} fill={insuranceType === 'premium' ? '#FFD700' : 'transparent'} />
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 600, 
                              color: insuranceType === 'premium' ? '#FFD700' : '#9BA8B9'
                            }}>Premium</div>
                            <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>
                              Maximum protection & priority claim support
                            </div>
                          </div>
                        </div>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          border: insuranceType === 'premium' ? '2px solid #FFD700' : '2px solid #3A4A5E',
                          background: insuranceType === 'premium' ? '#FFD700' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {insuranceType === 'premium' && <Check size={14} color="#0A1628" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Summary */}
                {declaredValue && (
                  <div style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: 'rgba(74,226,74,0.08)',
                    border: '1px solid rgba(74,226,74,0.2)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <CheckCircle size={18} color="#4AE24A" />
                    <div style={{ fontSize: 13, color: '#4AE24A' }}>
                      <span style={{ fontWeight: 600 }}>€{parseFloat(declaredValue).toLocaleString()}</span> covered with <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{insuranceType}</span> protection
                    </div>
                  </div>
                )}
              </div>
            )}
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
