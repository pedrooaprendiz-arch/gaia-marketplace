import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PasswordGate from './components/PasswordGate';
import HomePage from './pages/Home';
import ResultsPage from './pages/Results';
import ProposalPage from './pages/Proposal';
import ContactPage from './pages/Contact';
import TransporterPage from './pages/Transporter';
import RoutePublishedPage from './pages/RoutePublished';
import RequestSubmittedPage from './pages/RequestSubmitted';
import PricingPage from './pages/Pricing';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <PasswordGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/proposal" element={<ProposalPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/transporter" element={<TransporterPage />} />
          <Route path="/route-published" element={<RoutePublishedPage />} />
          <Route path="/request-submitted" element={<RequestSubmittedPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </PasswordGate>
    </BrowserRouter>
  );
}

export default App;
