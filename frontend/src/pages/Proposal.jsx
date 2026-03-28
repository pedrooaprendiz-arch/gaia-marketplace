import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Shield, Clock, ShieldCheck, Star, Award, Check } from 'lucide-react';
import { calculateGaiaPrice, BOX_PRICE_TIERS } from '../utils/pricing';
import './Proposal.css';

// Insurance pricing based on type and declared value
const INSURANCE_RATES = {
  basic: 0.015,    // 1.5% of declared value
  standard: 0.025, // 2.5% of declared value  
  premium: 0.04    // 4% of declared value
};

const INSURANCE_MIN = {
  basic: 15,
  standard: 25,
  premium: 45
};

export default function ProposalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const { shipmentType, fromCity, toCity, distance, smallBoxQty, mediumBoxQty, largeBoxQty, palletQty, palletWeight, loadType, vehicleType, vehicleQty, movingBoxes, largeItems, complexity, offer, insurance_selected, insurance_type, declared_goods_value } = data;
  const optimization = offer?.optimization || 'optimized';
  
  // Calculate insurance cost based on user selection from Home page
  const calculateInsuranceCost = () => {
    if (!insurance_selected || !declared_goods_value) return 0;
    const rate = INSURANCE_RATES[insurance_type] || INSURANCE_RATES.standard;
    const minCost = INSURANCE_MIN[insurance_type] || INSURANCE_MIN.standard;
    const calculatedCost = Math.round(declared_goods_value * rate);
    return Math.max(calculatedCost, minCost);
  };
  
  const insuranceCostFromHome = calculateInsuranceCost();

  // Calculate breakdown using STRICT pricing
  const getBreakdown = () => {
    const lines = [];
    let subtotal = { min: 0, max: 0 };

    // Helper to get box price by distance tier
    const getBoxPrice = (size) => {
      const tiers = BOX_PRICE_TIERS[size];
      if (distance < 200) return tiers.min;
      if (distance < 1000) return tiers.mid;
      return tiers.max;
    };

    switch (shipmentType) {
      case 'gaiabox': {
        // 3-TIER DISTANCE PRICING: 0-200km=min, 200-1000km=mid, 1000km+=max
        if (smallBoxQty > 0) {
          const unitPrice = getBoxPrice('small');
          const itemTotal = smallBoxQty * unitPrice;
          lines.push({ label: `Small Box ×${smallBoxQty}`, unit: `€${unitPrice}`, min: itemTotal, max: Math.round(itemTotal * 1.15) });
        }
        if (mediumBoxQty > 0) {
          const unitPrice = getBoxPrice('medium');
          const itemTotal = mediumBoxQty * unitPrice;
          lines.push({ label: `Medium Box ×${mediumBoxQty}`, unit: `€${unitPrice}`, min: itemTotal, max: Math.round(itemTotal * 1.15) });
        }
        if (largeBoxQty > 0) {
          const unitPrice = getBoxPrice('large');
          const itemTotal = largeBoxQty * unitPrice;
          lines.push({ label: `Large Box ×${largeBoxQty}`, unit: `€${unitPrice}`, min: itemTotal, max: Math.round(itemTotal * 1.15) });
        }
        // Show distance tier info
        const tierLabel = distance < 200 ? '0-200km (min price)' : distance < 1000 ? '200-1000km (mid price)' : '1000km+ (max price)';
        lines.push({ label: `Distance: ${distance}km`, note: tierLabel });
        
        // Calculate total with distance
        const totalPrice = calculateGaiaPrice('gaiabox', { 
          smallQty: smallBoxQty || 0, 
          mediumQty: mediumBoxQty || 0, 
          largeQty: largeBoxQty || 0,
          distanceKm: distance
        });
        subtotal = totalPrice;
        break;
      }

      case 'pallet': {
        const p = calculateGaiaPrice('pallet', { 
          distanceKm: distance, 
          palletQty: palletQty || 1,
          weightKg: palletWeight || 500, 
          optimization 
        });
        lines.push({ label: `${palletQty || 1} Pallet${(palletQty || 1) > 1 ? 's' : ''} · ${distance}km`, min: p.min, max: p.max });
        subtotal = p;
        break;
      }

      case 'vehicle': {
        const p = calculateGaiaPrice('vehicle', { 
          distanceKm: distance, 
          vehicleType: vehicleType || 'car', 
          quantity: vehicleQty || 1, 
          optimization 
        });
        lines.push({ label: `${vehicleQty || 1} ${vehicleType || 'Car'} · ${distance}km`, min: p.min, max: p.max });
        subtotal = p;
        break;
      }

      case 'volume': {
        // DISTANCE-BASED: Show items + distance
        if (movingBoxes > 0) {
          const boxTotal = movingBoxes * 10;
          lines.push({ label: `Boxes ×${movingBoxes}`, unit: '€10', min: boxTotal, max: Math.round(boxTotal * 1.15) });
        }
        if (largeItems > 0) {
          const itemTotal = largeItems * 80;
          lines.push({ label: `Large Items ×${largeItems}`, unit: '€80', min: itemTotal, max: Math.round(itemTotal * 1.15) });
        }
        // Add distance line
        if (distance > 100) {
          lines.push({ label: `Distance (${distance}km)`, note: 'included' });
        }
        const p = calculateGaiaPrice('moving', { 
          distanceKm: distance,
          boxes: movingBoxes || 0, 
          largeItems: largeItems || 0, 
          complexity: complexity || 'standard', 
          optimization 
        });
        subtotal = p;
        break;
      }
    }

    return { lines, subtotal };
  };

  const { lines, subtotal } = getBreakdown();
  // Use insurance from Home page if selected, otherwise allow adding here
  const totalInsuranceCost = insurance_selected ? insuranceCostFromHome : (includeInsurance ? 25 : 0);
  const total = { min: subtotal.min + totalInsuranceCost, max: subtotal.max + totalInsuranceCost };

  const handleContinue = () => {
    navigate(`/contact?data=${encodeURIComponent(JSON.stringify({ 
      ...data, 
      finalPrice: total, 
      includeInsurance: insurance_selected || includeInsurance,
      finalInsuranceCost: totalInsuranceCost
    }))}`);
  };
  
  // Insurance type display info
  const getInsuranceIcon = () => {
    switch(insurance_type) {
      case 'basic': return <Shield size={20} color="#4ECDC4" />;
      case 'premium': return <Star size={20} color="#FFD700" fill="#FFD700" />;
      default: return <Award size={20} color="#4A90E2" />;
    }
  };
  
  const getInsuranceColor = () => {
    switch(insurance_type) {
      case 'basic': return '#4ECDC4';
      case 'premium': return '#FFD700';
      default: return '#4A90E2';
    }
  };

  return (
    <div className="app-container">
      <div className="proposal-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <div className="proposal-title">Offer Details</div>
      </div>

      <div className="proposal-content">
        <div className="proposal-card">
          <div className="proposal-company">{offer?.company?.name || 'Transport Company'}</div>
          <div className="proposal-route">
            <div className="route-point"><div className="route-icon"><MapPin size={16} color="#4A90E2" /></div><div><div className="route-label">From</div><div className="route-city">{fromCity}</div></div></div>
            <div className="route-line" />
            <div className="route-point"><div className="route-icon"><Navigation size={16} color="#4AE24A" /></div><div><div className="route-label">To</div><div className="route-city">{toCity}</div></div></div>
          </div>
          <div className="proposal-meta">
            <div><Clock size={16} /> {offer?.delivery_days || 3} days</div>
            <div style={{ color: offer?.route_type === 'Direct' ? '#4AE24A' : '#4A90E2' }}>{offer?.route_type || 'Standard'}</div>
          </div>
        </div>

        <div className="proposal-card">
          <div className="breakdown-title">Price Breakdown</div>
          {lines.map((l, i) => (
            <div key={i} className="breakdown-row">
              <div>{l.label} {l.unit && <span style={{ color: '#6B7B8F', fontSize: 11 }}>({l.unit} each)</span>}</div>
              {l.min !== undefined && <div>€{l.min} – €{l.max}</div>}
            </div>
          ))}
          <div className="breakdown-row subtotal">
            <div>Transport Subtotal</div>
            <div>€{subtotal.min} – €{subtotal.max}</div>
          </div>
        </div>

        {/* Insurance Card - Show selected insurance or allow adding */}
        {insurance_selected ? (
          <div className="proposal-card" style={{ 
            background: `linear-gradient(135deg, ${getInsuranceColor()}15, ${getInsuranceColor()}08)`,
            border: `1px solid ${getInsuranceColor()}40`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${getInsuranceColor()}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getInsuranceIcon()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: getInsuranceColor(), textTransform: 'capitalize' }}>
                    {insurance_type} Coverage
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 2 }}>
                    Cargo Insurance Active
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="#4AE24A" />
                <span style={{ color: '#4AE24A', fontSize: 12, fontWeight: 600 }}>Protected</span>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 14px',
              background: 'rgba(10,22,40,0.5)',
              borderRadius: 10
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#6B7B8F' }}>Declared Value</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>€{declared_goods_value?.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#6B7B8F' }}>Insurance Cost</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: getInsuranceColor() }}>+€{insuranceCostFromHome}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="proposal-card">
            <div className="insurance-section">
              <div className="insurance-header"><Shield size={18} color="#4A90E2" /><span>Add Cargo Insurance</span></div>
              <div className="insurance-toggle">
                <span>+€25</span>
                <label className="toggle"><input type="checkbox" checked={includeInsurance} onChange={e => setIncludeInsurance(e.target.checked)} /><span className="toggle-slider"></span></label>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7B8F', marginTop: 10 }}>
              Basic coverage for standard shipments
            </div>
          </div>
        )}

        <div className="proposal-card total-card">
          <div>Total</div>
          <div className="total-price">€{total.min} – €{total.max}</div>
        </div>

        <button className="continue-btn" onClick={handleContinue}>Continue with Transporter</button>
      </div>
    </div>
  );
}
