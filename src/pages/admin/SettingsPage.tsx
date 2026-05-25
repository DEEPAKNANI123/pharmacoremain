import { useState } from 'react';
import './SettingsPage.css';

export default function SettingsPage() {
  const [branchName, setBranchName] = useState('Main Branch — Dubai');
  const [taxRegime, setTaxRegime] = useState('UAE — VAT 5%');
  const [authority, setAuthority] = useState('DHA — Dubai Health Authority');
  const [currency, setCurrency] = useState('AED — UAE Dirham');

  const handleSave = () => {
    alert("System configurations saved successfully.");
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <button className="btn btn-primary px-8" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-panel">
          <h3 className="settings-section-title">Branch Configuration</h3>
          
          <div className="form-group">
            <label>Branch Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Country / Tax Regime</label>
            <select 
              className="form-control" 
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value)}
            >
              <option>UAE — VAT 5%</option>
              <option>KSA — VAT 15%</option>
              <option>None (Tax Exempt)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Regulatory Authority</label>
            <input 
              type="text" 
              className="form-control" 
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Default Currency</label>
            <select 
              className="form-control" 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option>AED — UAE Dirham</option>
              <option>USD — US Dollar</option>
              <option>SAR — Saudi Riyal</option>
            </select>
          </div>
        </div>

        <div className="settings-panel">
          <h3 className="settings-section-title">Notification Templates</h3>
          
          <div className="notification-list">
            <div className="notification-item">
              <span className="notification-name">Expiry alerts (30/15/7/1 day)</span>
              <span className="status-enabled">Enabled</span>
            </div>
            <div className="notification-item">
              <span className="notification-name">Compliance due date alerts</span>
              <span className="status-enabled">Enabled</span>
            </div>
            <div className="notification-item">
              <span className="notification-name">Cold store temperature alerts</span>
              <span className="status-enabled">Enabled</span>
            </div>
            <div className="notification-item">
              <span className="notification-name">WhatsApp Business escalation</span>
              <span className="status-config">Config needed</span>
            </div>
            <div className="notification-item">
              <span className="notification-name">Low stock auto-reorder alerts</span>
              <span className="status-enabled">Enabled</span>
            </div>
            <div className="notification-item">
              <span className="notification-name">Customer birthday reminders</span>
              <span className="status-enabled">Enabled</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
             <p className="text-xs text-muted leading-relaxed">
               System alerts are delivered via internal notifications and registered admin emails. 
               Regulatory compliance alerts are synchronized with the Federal Tax Authority (FTA).
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
