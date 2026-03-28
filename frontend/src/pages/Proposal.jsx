import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Shield, Clock, ShieldCheck } from 'lucide-react';
import { calculateGaiaPrice, BOX_PRICE_TIERS } from '../utils/pricing';
import './Proposal.css';

// Insurance = 7% of transport subtotal
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

  // Calculate insurance cost as 7% of subtotal
  const calculateInsuranceCost = (amount) => {
    if (!amount) return 0;
    return Math.round(amount * INSURANCE_RATE);
  };

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
          lines.push({
            label: `Small Box ×${smallBoxQty}`,
            unit: `€${unitPrice}`,
            min: itemTotal,
            max: Math.round(itemTotal * 1.15)
          });
        }

        if (mediumBoxQty
