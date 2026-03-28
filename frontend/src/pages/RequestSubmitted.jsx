import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import './RequestSubmitted.css';

export default function RequestSubmittedPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="submitted-content">
        <div className="submitted-icon">
          <CheckCircle size={72} color="#4AE24A" />
        </div>
        
        <div className="submitted-title">Request Submitted</div>
        <div className="submitted-subtitle">
          GAIA is now coordinating your shipment
        </div>

        <button className="home-btn" onClick={() => navigate('/')} data-testid="back-home-btn">
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
