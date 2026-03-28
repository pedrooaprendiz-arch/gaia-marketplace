import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import './Contact.css';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const data = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const { fromCity, toCity, offer, finalPrice, includeInsurance } = data;

  return (
    <div className="app-container">
      <div className="contact-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <div className="contact-title">Contact Transporter</div>
      </div>

      <div className="contact-content">
        <div className="contact-success">
          <CheckCircle size={48} color="#4AE24A" />
          <div className="success-title">Direct Contact Setup</div>
          <div className="success-subtitle">GAIA connects you directly with verified providers</div>
        </div>

        <div className="contact-card">
          <div className="company-name">{offer?.company?.name || 'Transport Company'}</div>
          <div className="contact-route">
            <span><MapPin size={14} color="#4A90E2" /> {fromCity}</span>
            <span>→</span>
            <span><Navigation size={14} color="#4AE24A" /> {toCity}</span>
          </div>
          <div className="contact-price">
            <span>Quoted Price</span>
            <span className="price-value">€{finalPrice?.min || 0} – €{finalPrice?.max || 0}</span>
          </div>
          {includeInsurance && <div style={{ fontSize: 12, color: '#4AE24A', marginTop: 8 }}>✓ Insurance included</div>}
        </div>

        <div className="contact-card">
          <div className="contact-person-title">Contact Person</div>
          <div className="contact-person-name">Maria Santos</div>
          <div className="contact-person-role">Operations Manager</div>
          <div className="contact-actions">
            <a href="tel:+351912345678" className="contact-action-btn call"><Phone size={18} /><span>Call</span></a>
            <a href="mailto:contact@transeuropa.eu" className="contact-action-btn email"><Mail size={18} /><span>Email</span></a>
            <button className="contact-action-btn message"><MessageSquare size={18} /><span>Message</span></button>
          </div>
        </div>

        <button className="done-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
}
