import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, CheckCircle, Zap } from 'lucide-react';
import './Contact.css';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const { fromCity, toCity, offer, finalPrice, includeInsurance } = data;

  const handleProceed = () => {
    navigate('/request-submitted');
  };

  return (
    <div className="app-container">
      <div className="contact-header">
        <button className="back-btn" onClick={() => navigate(-1)} data-testid="back-btn">
          <ArrowLeft size={24} />
        </button>
        <div className="contact-title">Confirmation</div>
      </div>

      <div className="contact-content">
        {/* Success Badge */}
        <div className="contact-success">
          <div className="success-icon-wrapper">
            <CheckCircle size={40} color="#4AE24A" />
          </div>
          <div className="success-title">Shipment Ready</div>
          <div className="success-subtitle">Your request has been matched</div>
        </div>

        {/* Route Summary Card */}
        <div className="contact-card">
          <div className="contact-route-summary">
            <div className="route-endpoint">
              <MapPin size={18} color="#4A90E2" />
              <span>{fromCity}</span>
            </div>
            <div className="route-arrow">→</div>
            <div className="route-endpoint">
              <Navigation size={18} color="#4AE24A" />
              <span>{toCity}</span>
            </div>
          </div>
          <div className="contact-price-summary">
            <span className="price-label">Total</span>
            <span className="price-value">€{finalPrice?.min || 0} – €{finalPrice?.max || 0}</span>
          </div>
          {includeInsurance && (
            <div className="insurance-badge">
              <CheckCircle size={14} color="#4AE24A" />
              <span>GAIA Smart Insurance included</span>
            </div>
          )}
        </div>

        {/* Provider Card - Clean Platform Style */}
        <div className="contact-card provider-card">
          <div className="provider-company">{offer?.company?.name || 'Transport Company'}</div>
          <div className="provider-match">
            <Zap size={16} color="#4AE24A" />
            <span>Smart Match Ready</span>
          </div>
        </div>

        {/* Single CTA Button */}
        <button className="proceed-btn" onClick={handleProceed} data-testid="proceed-btn">
          Proceed
        </button>
      </div>
    </div>
  );
}
