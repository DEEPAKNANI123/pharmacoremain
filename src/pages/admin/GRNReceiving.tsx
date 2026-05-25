import React, { useState } from 'react';
import { 
  X, ChevronRight, Clipboard, Search, 
  ArrowRight, Check, Clock, Grid,
  Calendar, User, File, CheckCircle
} from 'lucide-react';
import './GRNReceiving.css';

interface POSelection {
  id: string;
  poNumber: string;
  supplier: string;
  items: number;
  value: number;
  expectedDate: string;
  status: 'In Transit' | 'Overdue';
}

export default function GRNReceiving() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const steps = [
    { id: 1, label: 'Select PO' },
    { id: 2, label: 'Receive Items' },
    { id: 3, label: 'Quality Check' },
    { id: 4, label: 'Variance Review' },
    { id: 5, label: 'Post & Invoice' }
  ];

  const pos: POSelection[] = [
    { 
      id: '1', 
      poNumber: 'PO-2026-0091', 
      supplier: 'Gulf Pharma Dist.', 
      items: 18, 
      value: 24500, 
      expectedDate: 'Apr 9', 
      status: 'In Transit' 
    },
    { 
      id: '2', 
      poNumber: 'PO-2026-0090', 
      supplier: 'Emirates MedSupply', 
      items: 7, 
      value: 8200, 
      expectedDate: 'Apr 6', 
      status: 'Overdue' 
    }
  ];

  const showSuccess = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="grn-container">
      <div className="grn-header">
        <h1>GRN — Goods Receiving</h1>
        <button className="btn btn-outline flex-center gap-2" onClick={() => showSuccess("History log opened")}>
          View History
        </button>
      </div>

      <div className="grn-stepper">
        <div className="stepper-line"></div>
        {steps.map((step) => (
          <div key={step.id} className={`stepper-item ${currentStep === step.id ? 'active' : currentStep > step.id ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > step.id ? <Check size={20} /> : step.id}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>

      <div className="grn-grid">
        {/* Receiving Details Panel */}
        <div className="grn-panel">
          <h2>Receiving Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Receiving Branch</label>
              <select className="form-control">
                <option>Main Branch — Dubai</option>
                <option>Sharjah Branch</option>
                <option>Abu Dhabi Branch</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Received</label>
              <input type="date" className="form-control" defaultValue="2026-04-09" />
            </div>
            <div className="form-group">
              <label>Received By</label>
              <input type="text" className="form-control" defaultValue="Sara Hassan — Inventory Manager" />
            </div>
            <div className="form-group">
              <label>Delivery Note #</label>
              <input type="text" className="form-control" placeholder="e.g. DN-44821" />
            </div>
          </div>
        </div>

        {/* PO Selection Panel */}
        <div className="grn-panel">
          <h2>Select Purchase Order</h2>
          <div className="po-selection-list scroll-y-400">
            {pos.map((po) => (
              <div 
                key={po.id} 
                className={`po-card ${selectedPO === po.id ? 'selected' : ''}`}
                onClick={() => setSelectedPO(po.id)}
              >
                <div className="po-card-info">
                  <h4>{po.poNumber} — {po.supplier}</h4>
                  <p>{po.items} items · AED {po.value.toLocaleString()} · Expected {po.expectedDate}</p>
                </div>
                <div className="po-card-status">
                  <span className={`po-badge ${po.status.toLowerCase().replace(' ', '-')}`}>
                    {po.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grn-footer">
        <button 
          className="btn-next" 
          disabled={!selectedPO}
          onClick={() => showSuccess("Navigating to Item Receipt...")}
        >
          Next: Receive Items <ArrowRight size={18} />
        </button>
      </div>

      {toast && (
        <div className="toast animate-fade-in success">
          <CheckCircle size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
