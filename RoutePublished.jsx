.pricing-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: var(--bg-secondary);
}

.pricing-header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-left: 12px;
}

.pricing-content {
  padding: 20px;
}

.pricing-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.pricing-banner-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-gold);
}

.pricing-banner-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-card {
  background-color: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  position: relative;
}

.plan-card.popular {
  border: 2px solid var(--accent-gold);
}

.popular-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--accent-gold);
  color: #0A1628;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.plan-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.plan-price {
  margin-bottom: 16px;
}

.price-currency {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  vertical-align: top;
}

.price-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
}

.price-period {
  font-size: 14px;
  color: var(--text-secondary);
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.plan-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background-color: var(--bg-primary);
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
}

.plan-btn.primary {
  background-color: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #0A1628;
}

/* Support Section */
.support-section {
  margin-top: 32px;
}

.support-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.support-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background-color: var(--bg-secondary);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.support-card:hover {
  border-color: var(--accent-blue);
}

.support-card.logistics:hover {
  border-color: #4ECDC4;
}

.support-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(74, 144, 226, 0.1);
}

.support-card-icon.logistics {
  background-color: rgba(78, 205, 196, 0.1);
}

.support-card-content {
  flex: 1;
}

.support-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.support-card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Trust Section */
.trust-section {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: var(--bg-secondary);
  border-radius: 14px;
  padding: 20px;
  margin-top: 24px;
}

.trust-item {
  text-align: center;
}

.trust-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-blue);
}

.trust-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.trust-divider {
  width: 1px;
  height: 40px;
  background-color: #2A3A4E;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: var(--bg-secondary);
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-body {
  margin-bottom: 20px;
}

.modal-body p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.contact-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background-color: var(--bg-card);
  border-radius: 10px;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 14px;
  transition: background-color 0.2s;
}

.contact-option:hover {
  background-color: #2A3A4E;
}

.modal-close-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background-color: var(--accent-blue);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
