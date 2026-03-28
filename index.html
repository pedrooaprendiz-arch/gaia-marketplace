import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, TrendingUp, Users, Zap, Headphones, UserCheck, MessageCircle, Mail } from 'lucide-react';
import './Pricing.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState('support'); // 'support' or 'logistics'

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pricing-plans`);
      const data = await response.json();
      setPlans(data.plans || data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback plans
      setPlans([
        { name: 'Starter', price: '19-29', features: ['5 routes/month', 'Basic demand view'] },
        { name: 'Professional', price: '49-79', features: ['Unlimited routes', 'Full analytics'], popular: true },
        { name: 'Fleet', price: '99-149', features: ['10 vehicles', 'API access'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'starter': return Users;
      case 'professional': return TrendingUp;
      case 'fleet': return Zap;
      default: return Crown;
    }
  };

  const handleSupportClick = (type) => {
    setContactType(type);
    setShowContactModal(true);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner" style={{ minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="pricing-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="pricing-header-title">Join GAIA Network</div>
      </div>

      <div className="pricing-content">
        <div className="pricing-banner">
          <Crown size={32} color="#FFD700" />
          <div className="pricing-banner-text">
            <div className="pricing-banner-title">Increase Revenue by 35%</div>
            <div className="pricing-banner-subtitle">Access premium shipper network</div>
          </div>
        </div>

        <div className="plans-list">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.name);
            const priceDisplay = plan.price_range || plan.price || '€29-49';
            const isPopular = plan.popular || plan.highlighted;
            return (
              <div 
                key={index} 
                className={`plan-card ${isPopular ? 'popular' : ''}`}
              >
                {isPopular && <div className="popular-badge">Most Popular</div>}
                
                <div className="plan-header">
                  <Icon size={24} color={isPopular ? '#FFD700' : '#4A90E2'} />
                  <div className="plan-name">{plan.name}</div>
                </div>

                <div className="plan-price">
                  <span className="price-value">{priceDisplay}</span>
                  <span className="price-period">/month</span>
                </div>

                <div className="plan-features">
                  {plan.features?.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <Check size={16} color="#4AE24A" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`plan-btn ${plan.popular ? 'primary' : ''}`}>
                  Get Started
                </button>
              </div>
            );
          })}
        </div>

        {/* NEW: Support Section */}
        <div className="support-section">
          <div className="support-section-title">Need Help?</div>
          
          <div 
            className="support-card"
            onClick={() => handleSupportClick('support')}
          >
            <div className="support-card-icon">
              <Headphones size={24} color="#4A90E2" />
            </div>
            <div className="support-card-content">
              <div className="support-card-title">Request Support</div>
              <div className="support-card-desc">Get help with your account or technical issues</div>
            </div>
            <MessageCircle size={20} color="#6B7B8F" />
          </div>

          <div 
            className="support-card logistics"
            onClick={() => handleSupportClick('logistics')}
          >
            <div className="support-card-icon logistics">
              <UserCheck size={24} color="#4ECDC4" />
            </div>
            <div className="support-card-content">
              <div className="support-card-title">Access Logistics Team</div>
              <div className="support-card-desc">Virtual logistics team to support your operations</div>
            </div>
            <MessageCircle size={20} color="#6B7B8F" />
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="trust-section">
          <div className="trust-item">
            <div className="trust-value">24/7</div>
            <div className="trust-label">Support</div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <div className="trust-value">3,500+</div>
            <div className="trust-label">Partners</div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <div className="trust-value">98%</div>
            <div className="trust-label">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {contactType === 'support' ? (
                <>
                  <Headphones size={28} color="#4A90E2" />
                  <div className="modal-title">Request Support</div>
                </>
              ) : (
                <>
                  <UserCheck size={28} color="#4ECDC4" />
                  <div className="modal-title">Logistics Team</div>
                </>
              )}
            </div>

            <div className="modal-body">
              {contactType === 'support' ? (
                <p>Our support team is available 24/7 to help you with any questions or technical issues.</p>
              ) : (
                <p>Access our virtual logistics team to optimize your operations and maximize efficiency.</p>
              )}

              <div className="contact-options">
                <a href="mailto:support@gaia-logistics.eu" className="contact-option">
                  <Mail size={20} color="#4A90E2" />
                  <span>support@gaia-logistics.eu</span>
                </a>
                <a href="tel:+351210000000" className="contact-option">
                  <Headphones size={20} color="#4AE24A" />
                  <span>+351 21 000 0000</span>
                </a>
              </div>
            </div>

            <button 
              className="modal-close-btn"
              onClick={() => setShowContactModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
