import './VatReturns.css';
import './VatReturns.css';

export default function VatReturns() {
  return (
    <div className="vat-container">
      <div className="vat-header">
        <h1>VAT & Statutory Returns</h1>
        <button className="btn btn-primary">Prepare Return</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="vat-summary-panel">
          <h3 className="text-sm font-bold mb-4 opacity-70">Q1 2026 VAT Summary</h3>
          <div className="vat-list">
            <div className="vat-line-item">
              <span className="text-sm">Standard-rated supplies</span>
              <span className="font-bold text-sm">AED 296,400</span>
            </div>
            <div className="vat-line-item">
              <span className="text-sm">Zero-rated supplies</span>
              <span className="font-bold text-sm">AED 44,200</span>
            </div>
            <div className="vat-line-item">
              <span className="text-sm">Exempt supplies</span>
              <span className="font-bold text-sm">AED 12,100</span>
            </div>
            <div className="vat-line-item">
              <span className="text-sm font-bold" style={{ color: '#dc2626' }}>Output VAT (5%)</span>
              <span className="font-bold text-sm" style={{ color: '#dc2626' }}>AED 14,820</span>
            </div>
            <div className="vat-line-item">
              <span className="text-sm" style={{ color: '#16a34a' }}>Input VAT (recoverable)</span>
              <span className="font-bold text-sm" style={{ color: '#16a34a' }}>AED 6,210</span>
            </div>
            <div className="vat-line-item vat-total-row">
              <span className="text-lg font-bold">Net VAT Payable</span>
              <span className="text-lg font-bold" style={{ color: '#dc2626' }}>AED 8,610</span>
            </div>
          </div>
        </div>

        <div className="vat-summary-panel">
          <h3 className="text-sm font-bold mb-4 opacity-70">Returns Status</h3>
          <div className="returns-list">
            <div className="return-status-item">
              <div>
                <p className="font-bold text-sm">Q1 2026 VAT Return</p>
                <p className="text-xs text-muted">Due Apr 16 · Not submitted · AED 8,610</p>
              </div>
              <button className="btn btn-primary btn-sm px-3 py-1 text-xs">Submit</button>
            </div>
            <div className="return-status-item">
              <div>
                <p className="font-bold text-sm">Q4 2025 VAT Return</p>
                <p className="text-xs text-muted">Submitted Jan 14 · AED 7,940</p>
              </div>
              <span className="badge badge-success text-xs px-2 py-1">Filed</span>
            </div>
            <div className="return-status-item">
              <div>
                <p className="font-bold text-sm">Q3 2025 VAT Return</p>
                <p className="text-xs text-muted">Submitted Oct 12 · AED 8,120</p>
              </div>
              <span className="badge badge-success text-xs px-2 py-1">Filed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
