import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Shield, Clock, ShieldCheck } from 'lucide-react';
import { calculateGaiaPrice, BOX_PRICE_TIERS } from '../utils/pricing';
import './Proposal.css';

// Insurance = 7% of subtotal
const INSURANCE_RATE = 0.07;

export default function ProposalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));

  const {
    shipmentType,
    fromCity,
    toCity,
    distance,
    smallBoxQty,
    mediumBoxQty,
    largeBoxQty,
    palletQty,
    palletWeight,
    vehicleType,
    vehicleQty,
    movingBoxes,
    largeItems,
    complexity,
    offer,
    insurance_selected
  } = data;

  const optimization = offer?.optimization || 'optimized';

  // Insurance = 7% do subtotal
  const calculateInsuranceCost = (amount) => {
    if (!amount) return 0;
    return Math.round(amount * INSURANCE_RATE);
  };

  const getBoxPrice = (size) => {
    const tiers = BOX_PRICE_TIERS[size];
    if (distance < 200) return tiers.min;
    if (distance < 1000) return tiers.mid;
    return tiers.max;
  };

  const getBreakdown = () => {
    const lines = [];
    let subtotal = { min: 0, max: 0 };

    switch (shipmentType) {

      case 'gaiabox': {
        if (smallBoxQty > 0) {
          const price = getBoxPrice('small');
          const total = smallBoxQty * price;
          lines.push({ label: `Small Box ×${smallBoxQty}`, min: total, max: Math.round(total * 1.15) });
        }

        if (mediumBoxQty > 0) {
          const price = getBoxPrice('medium');
          const total = mediumBoxQty * price;
          lines.push({ label: `Medium Box ×${mediumBoxQty}`, min: total, max: Math.round(total * 1.15) });
        }

        if (largeBoxQty > 0) {
          const price = getBoxPrice('large');
          const total = largeBoxQty * price;
          lines.push({ label: `Large Box ×${largeBoxQty}`, min: total, max: Math.round(total * 1.15) });
        }

        const p = calculateGaiaPrice('gaiabox', {
          smallQty: smallBoxQty || 0,
          mediumQty: mediumBoxQty || 0,
          largeQty: largeBoxQty || 0,
          distanceKm: distance
        });

        subtotal = p;
        break;
      }

      case 'pallet': {
        const p = calculateGaiaPrice('pallet', {
          distanceKm: distance,
          palletQty: palletQty || 1,
          weightKg: palletWeight || 500,
          optimization
        });

        lines.push({ label: `${palletQty || 1} Pallet(s)`, min: p.min, max: p.max });
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

        lines.push({ label: `${vehicleQty || 1} Vehicle`, min: p.min, max: p.max });
        subtotal = p;
        break;
      }

      case 'volume': {
        if (movingBoxes > 0) {
          const total = movingBoxes * 10;
          lines.push({ label: `Boxes ×${movingBoxes}`, min: total, max: Math.round(total * 1.15) });
        }

        if (largeItems > 0) {
          const total = largeItems * 80;
          lines.push({ label: `Large Items ×${largeItems}`, min: total, max: Math.round(total * 1.15) });
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

  // Seguro
  const insuranceCost = insurance_selected
    ? calculateInsuranceCost(subtotal.min)
    : (includeInsurance ? 12 : 0);

  const total = {
    min: subtotal.min + insuranceCost,
    max: subtotal.max + insuranceCost
  };

  const handleContinue = () => {
    navigate(`/contact?data=${encodeURIComponent(JSON.stringify({
      ...data,
      finalPrice: total,
      includeInsurance: insurance_selected || includeInsurance,
      finalInsuranceCost: insuranceCost
    }))}`);
  };

  return (
    <div className="app-container">
      <div className="proposal-header">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h2>Offer Details</h2>
      </div>

      <div className="proposal-content">

        <div className="proposal-card">
          <h3>{offer?.company?.name || 'Transport Company'}</h3>
          <div>{fromCity} → {toCity}</div>
          <div><Clock size={14} /> {offer?.delivery_days || 3} days</div>
        </div>

        <div className="proposal-card">
          <h3>Price Breakdown</h3>
          {lines.map((l, i) => (
            <div key={i}>
              {l.label} — €{l.min} – €{l.max}
            </div>
          ))}
          <div><strong>Subtotal:</strong> €{subtotal.min} – €{subtotal.max}</div>
        </div>

        {!insurance_selected && (
          <div className="proposal-card">
            <h3>Add Insurance</h3>
            <label>
              <input
                type="checkbox"
                checked={includeInsurance}
                onChange={e => setIncludeInsurance(e.target.checked)}
              />
              Add insurance (+€12)
            </label>
          </div>
        )}

        <div className="proposal-card">
          <h2>Total: €{total.min} – €{total.max}</h2>
        </div>

        <button onClick={handleContinue}>
          Continue
        </button>

      </div>
    </div>
  );
}
