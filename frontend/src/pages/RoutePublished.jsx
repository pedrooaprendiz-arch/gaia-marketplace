import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import './RoutePublished.css';

export default function RoutePublishedPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="published-content">
        <div className="published-icon">
          <CheckCircle size={80} color="#4AE24A" />
        </div>
        
        <div className="published-title">Route Published!</div>
        <div className="published-subtitle">
          Your route is now visible to shippers across Europe
        </div>

        <div className="published-stats">
          <div className="stat-box">
            <div className="stat-number">2,340+</div>
            <div className="stat-label">Active Shippers</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">24h</div>
            <div className="stat-label">Avg. Match Time</div>
          </div>
        </div>

        <div className="published-note">
          You will receive notifications when shippers show interest in your route.
        </div>

        <button className="home-btn" onClick={() => navigate('/')}>
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
