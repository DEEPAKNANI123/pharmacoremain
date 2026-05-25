import { Plus, Wallet, Landmark, Receipt, CreditCard } from 'lucide-react';
import './Treasury.css';

export default function Treasury() {
  return (
    <div className="treasury-container">
      <div className="treasury-header">
        <h1>Treasury & Cash</h1>
        <button className="btn btn-primary flex-center gap-2">
          <Plus size={18} /> New Entry
        </button>
      </div>

      <div className="treasury-grid">
        <div className="treasury-panel">
          <div className="flex-center gap-3 mb-2">
            <Wallet className="text-primary" size={20} />
            <span className="text-muted text-sm font-bold">Cash on Hand</span>
          </div>
          <h2 className="text-2xl font-bold">AED 28,400</h2>
        </div>
        <div className="treasury-panel">
          <div className="flex-center gap-3 mb-2">
            <Landmark className="text-success" size={20} />
            <span className="text-muted text-sm font-bold">Bank Balance</span>
          </div>
          <h2 className="text-2xl font-bold">AED 214,800</h2>
        </div>
        <div className="treasury-panel">
          <div className="flex-center gap-3 mb-2">
            <Receipt className="text-warning" size={20} />
            <span className="text-muted text-sm font-bold">COD to Reconcile</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#d97706' }}>AED 4,200</h2>
        </div>
        <div className="treasury-panel">
          <div className="flex-center gap-3 mb-2">
            <CreditCard className="text-danger" size={20} />
            <span className="text-muted text-sm font-bold">Payables (7d)</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#dc2626' }}>AED 31,500</h2>
        </div>
      </div>

      <div className="treasury-list-grid">
        <div className="treasury-panel">
          <h3 className="text-sm font-bold mb-4 opacity-70">Recent Transactions</h3>
          <div className="cash-list">
            <div className="cash-item">
              <div>
                <p className="font-bold text-sm">POS Cash Collection</p>
                <p className="text-xs text-muted">Today 18:00</p>
              </div>
              <span className="amount-pos">+AED 8,240</span>
            </div>
            <div className="cash-item">
              <div>
                <p className="font-bold text-sm">Supplier — Gulf Pharma</p>
                <p className="text-xs text-muted">Apr 8</p>
              </div>
              <span className="amount-neg">-AED 18,000</span>
            </div>
            <div className="cash-item">
              <div>
                <p className="font-bold text-sm">Online Order Settlement</p>
                <p className="text-xs text-muted">Apr 8</p>
              </div>
              <span className="amount-pos">+AED 3,180</span>
            </div>
          </div>
        </div>

        <div className="treasury-panel">
          <h3 className="text-sm font-bold mb-4 opacity-70">Upcoming Payments</h3>
          <div className="upcoming-list">
            <div className="upcoming-item">
              <div>
                <p className="font-bold text-sm">Emirates MedSupply Inv #4401</p>
                <p className="text-xs text-muted">Due Apr 12</p>
              </div>
              <span className="font-bold text-sm">AED 8,200</span>
            </div>
            <div className="upcoming-item">
              <div>
                <p className="font-bold text-sm">VAT Return Q1 2026</p>
                <p className="text-xs text-muted">Due Apr 16</p>
              </div>
              <span className="font-bold text-sm text-danger">AED 14,820</span>
            </div>
            <div className="upcoming-item">
              <div>
                <p className="font-bold text-sm">Al Nahdi Pharma Inv #8820</p>
                <p className="text-xs text-muted">Due Apr 20</p>
              </div>
              <span className="font-bold text-sm">AED 9,300</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
