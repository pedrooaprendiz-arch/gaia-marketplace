import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, TrendingDown, Star, CheckCircle, Award } from 'lucide-react';
import { calculateGaiaPrice, BOX_WEIGHTS, GAIA_UI, createOfferCard } from '../utils/pricing';
import './Results.css';

const ROUTE_CONFIGS = [
  { type: 'Direct', optimization: 'optimized', days: 2, matchType: 'direct' },
  { type: '1 Stop', optimization: 'standard', days: 3, matchType: 'good' },
  { type: 'Eco Route', optimization: 'low', days: 5, matchType: 'good' },
];

const COMPANIES = [
  { name: 'EuroSpeed Express', rating: 4.9 },
  { name: 'FlexiFreight AG', rating: 4.7 },
  { name: 'BudgetCargo EU', rating: 4.5 },
];

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const { shipmentType, fromCity, toCity, distance, smallBoxQty, mediumBoxQty, largeBoxQty, palletQty, palletWeight, loadType, vehicleType, vehicleQty, movingBoxes, largeItems, complexity } = data;

  useEffect(() => { generateOffers(); }, []);

  const calculatePrice = (optimization) => {
    switch (shipmentType) {
      case 'gaiabox': {
        // DISTANCE-BASED: Include distance in calculation
        return calculateGaiaPrice('gaiabox', { 
          smallQty: smallBoxQty || 0, 
          mediumQty: mediumBoxQty || 0, 
          largeQty: largeBoxQty || 0,
          distanceKm: distance,
          optimization 
        });
      }
      case 'pallet': {
        return calculateGaiaPrice('pallet', { 
          distanceKm: distance, 
          palletQty: palletQty || 1,
          weightKg: palletWeight || 500, 
          optimization 
        });
      }
      case 'vehicle':
        return calculateGaiaPrice('vehicle', { 
          distanceKm: distance, 
          vehicleType: vehicleType || 'car', 
          quantity: vehicleQty || 1, 
          optimization 
        });
      case 'volume':
        // DISTANCE-BASED: Include distance in calculation
        return calculateGaiaPrice('moving', { 
          distanceKm: distance,
          boxes: movingBoxes || 0, 
          largeItems: largeItems || 0, 
          complexity: complexity || 'standard', 
          optimization 
        });
      default: return { min: 0, max: 0 };
    }
  };

  const generateOffers = () => {
    const generated = ROUTE_CONFIGS.map((cfg, i) => {
      const price = calculatePrice(cfg.optimization);
      // Calculate market price (12% higher for "savings" display)
      const marketPrice = { min: Math.round(price.min * 1.12), max: Math.round(price.max * 1.12) };
      const savingsPercent = 12;
      
      return {
        id: `offer-${i}`,
        route_type: cfg.type,
        optimization: cfg.optimization,
        price,
        marketPrice,
        savingsPercent,
        delivery_days: cfg.days,
        company: COMPANIES[i],
        insurance_included: i === 0,
        matchType: cfg.matchType,
        highlights: [GAIA_UI.verifiedLabel, GAIA_UI.capacityLabel],
      };
    });
    setOffers(generated);
  };

  const getLabel = () => {
    const totalBoxes = (smallBoxQty || 0) + (mediumBoxQty || 0) + (largeBoxQty || 0);
    switch (shipmentType) {
      case 'gaiabox': return `${totalBoxes} box${totalBoxes !== 1 ? 'es' : ''}`;
      case 'pallet': return `${palletQty || 1} pallet${(palletQty || 1) !== 1 ? 's' : ''}`;
      case 'vehicle': return `${vehicleQty || 1} vehicle${(vehicleQty || 1) !== 1 ? 's' : ''} · ${distance}km`;
      case 'volume': return `moving service`;
      default: return '';
    }
  };

  const getColor = (type) => ({ 'Direct': '#4AE24A', '1 Stop': '#4A90E2', 'Eco Route': '#FFB347' }[type] || '#4A90E2');

  const handleSelect = (offer) => {
    navigate(`/proposal?data=${encodeURIComponent(JSON.stringify({ ...data, offer }))}`);
  };

  return (
    <div className="app-container">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <div><div className="results-title">Offers</div><div className="results-route">{fromCity} → {toCity}</div></div>
      </div>

      <div className="results-list">
        {offers.map(o => (
          <div key={o.id} className="offer-card" data-testid={`offer-card-${o.id}`}>
            <div className="offer-header">
              <div className="offer-type-badge" style={{ backgroundColor: `${getColor(o.route_type)}20`, color: getColor(o.route_type) }}>
                {o.matchType === 'direct' ? GAIA_UI.matchLabel : 'Good Match'}
              </div>
              <div className="offer-savings"><TrendingDown size={14} /> ↓ {o.savingsPercent}% vs market</div>
            </div>
            <div className="offer-company">
              <div className="offer-company-name">{o.company.name}</div>
              <div className="offer-rating"><Star size={14} color="#FFD700" fill="#FFD700" /> {o.company.rating}</div>
            </div>
            <div className="offer-highlights">
              {o.highlights.map((h, i) => (
                <div key={i} className="offer-highlight"><CheckCircle size={12} color="#4AE24A" /><span>{h}</span></div>
              ))}
            </div>
            <div className="offer-details">
              <div className="offer-detail-item"><Clock size={16} color="#6B7B8F" /><span>{o.delivery_days} days</span></div>
              <div className="offer-detail-item"><Shield size={16} color="#6B7B8F" /><span>{o.insurance_included ? 'Included' : 'Optional'}</span></div>
            </div>
            <div className="offer-footer">
              <div className="offer-price-container">
                <div className="offer-price">€{o.price.min} – €{o.price.max}</div>
                <div className="offer-market-price">Market avg: €{o.marketPrice.min} – €{o.marketPrice.max}</div>
                <div className="offer-price-label">{getLabel()}</div>
              </div>
              <button className="offer-select-btn" onClick={() => handleSelect(o)} data-testid={`select-offer-${o.id}`}>{GAIA_UI.buttonSecondary}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
