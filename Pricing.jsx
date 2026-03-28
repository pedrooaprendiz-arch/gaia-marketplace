import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Shield, Clock } from 'lucide-react';
import { calculateGaiaPrice, BOX_PRICE_TIERS } from '../utils/pricing';
import './Proposal.css';

// GAIA Smart Insurance: 7% of transport subtotal
const INSURANCE_RATE = 0.07;

export default function ProposalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const { shipmentType, fromCity, toCity, distance, smallBoxQty, mediumBoxQty, largeBoxQty, palletQty, palletWeight, loadType, vehicleType, vehicleQty, movingBoxes, largeItems, complexity, offer } = data;
  const optimization = offer?.optimization || 'optimized';

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
        const tierLabel = distance < 200 ? '0-200km' : distance < 1000 ? '200-1000km' : '1000km+';
        lines.push({ label: `Distance: ${distance}km`, note: tierLabel });
        
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
        if (movingBoxes > 0) {
          const boxTotal = movingBoxes * 10;
          lines.push({ label: `Boxes ×${movingBoxes}`, unit: '€10', min: boxTotal, max: Math.round(boxTotal * 1.15) });
        }
        if (largeItems > 0) {
          const itemTotal = largeItems * 80;
          lines.push({ label: `Large Items ×${largeItems}`, unit: '€80', min: itemTotal, max: Math.round(itemTotal * 1.15) });
        }
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
      default:
        break;
    }

    return { lines, subtotal };
  };

  const { lines, subtotal } = getBreakdown();
  
  // GAIA Smart Insurance: 7% of subtotal.min
  const calculateInsuranceCost = () => {
    if (!includeInsurance) return 0;
    return Math.round(subtotal.min * INSURANCE_RATE);
  };
  
  const totalInsuranceCost = calculateInsuranceCost();
  const total = { 
    min: subtotal.min + totalInsuranceCost, 
    max: subtotal.max + totalInsuranceCost 
  };

  const handleContinue = () => {
    navigate(`/contact?data=${encodeURIComponent(JSON.stringify({ 
      ...data, 
      finalPrice: total, 
      includeInsurance,
      finalInsuranceCost: totalInsuranceCost
    }))}`);
  };

  return (
    <div className="app-container">
      <div className="proposal-header">
        <button className="back-btn" onClick={() => navigate(-1)} data-testid="back-btn">
          <ArrowLeft size={24} />
        </button>
        <div className="proposal-title">Offer Details</div>
      </div>

      <div className="proposal-content">
        {/* Company & Route Card */}
        <div className="proposal-card">
          <div className="proposal-company">{offer?.company?.name || 'Transport Company'}</div>
          <div className="proposal-route">
            <div className="route-point">
              <div className="route-icon"><MapPin size={16} color="#4A90E2" /></div>
              <div>
                <div className="route-label">From</div>
                <div className="route-city">{fromCity}</div>
              </div>
            </div>
            <div className="route-line" />
            <div className="route-point">
              <div className="route-icon"><Navigation size={16} color="#4AE24A" /></div>
              <div>
                <div className="route-label">To</div>
                <div className="route-city">{toCity}</div>
              </div>
            </div>
          </div>
          <div className="proposal-meta">
            <div><Clock size={16} /> {offer?.delivery_days || 3} days</div>
            <div style={{ color: offer?.route_type === 'Direct' ? '#4AE24A' : '#4A90E2' }}>
              {offer?.route_type || 'Standard'}
            </div>
          </div>
        </div>

        {/* Price Breakdown Card */}
        <div className="proposal-card">
          <div className="breakdown-title">Price Breakdown</div>
          {lines.map((l, i) => (
            <div key={i} className="breakdown-row">
              <div>
                {l.label} 
                {l.unit && <span className="breakdown-unit">({l.unit} each)</span>}
                {l.note && <span className="breakdown-note">{l.note}</span>}
              </div>
              {l.min !== undefined && <div className="breakdown-price">€{l.min} – €{l.max}</div>}
            </div>
          ))}
          <div className="breakdown-row subtotal">
            <div>Transport Subtotal</div>
            <div>€{subtotal.min} – €{subtotal.max}</div>
          </div>
        </div>

        {/* GAIA Smart Cargo Insurance */}
        <div className="proposal-card insurance-card">
          <div className="insurance-section">
            <div className="insurance-left">
              <div className="insurance-header">
                <Shield size={18} color="#4AE24A" />
                <span>GAIA Smart Cargo Insurance</span>
              </div>
              <div className="insurance-subtitle">
                Smart protection automatically calculated
              </div>
            </div>
            <div className="insurance-toggle">
              <span className="insurance-cost">+€{Math.round(subtotal.min * INSURANCE_RATE)}</span>
              <label className="toggle" data-testid="insurance-toggle">
                <input 
                  type="checkbox" 
                  checked={includeInsurance} 
                  onChange={e => setIncludeInsurance(e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          {includeInsurance && (
            <div className="insurance-active">
              <span>Protection Fee (7%)</span>
              <span className="insurance-active-cost">+€{totalInsuranceCost}</span>
            </div>
          )}
        </div>

        {/* Total Card */}
        <div className="proposal-card total-card">
          <div className="total-label">Total</div>
          <div className="total-price">€{total.min} – €{total.max}</div>
        </div>

        <button className="continue-btn" onClick={handleContinue} data-testid="continue-btn">
          Continue with Transporter
        </button>
      </div>
    </div>
  );
}
