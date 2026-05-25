import React, { useState } from 'react';
import { 
  Plus, Users, RefreshCcw, ShoppingCart, 
  Search, Filter, CheckCircle, Clock, 
  AlertCircle, ChevronRight, X, FileText,
  Truck, ArrowRight
} from 'lucide-react';
import './Procurement.css';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  items: number;
  value: number;
  created: string;
  status: 'In Transit' | 'Pending GRN' | 'Completed' | 'Invoice Mismatch';
}

export default function Procurement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    { id: '1', poNumber: 'PO-2026-0091', supplier: 'Gulf Pharma Dist.', items: 18, value: 24500, created: 'Apr 8', status: 'In Transit' },
    { id: '2', poNumber: 'PO-2026-0090', supplier: 'Emirates MedSupply', items: 7, value: 8200, created: 'Apr 6', status: 'Pending GRN' },
    { id: '3', poNumber: 'PO-2026-0089', supplier: 'Al Nahdi Pharma', items: 23, value: 31000, created: 'Apr 5', status: 'Completed' },
    { id: '4', poNumber: 'PO-2026-0088', supplier: 'Gulf Pharma Dist.', items: 4, value: 4100, created: 'Apr 3', status: 'Invoice Mismatch' },
  ]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const dashboardMetrics = [
    { label: 'Open POs', value: '12', icon: <ShoppingCart size={20} />, color: 'blue' },
    { label: 'Pending GRN', value: '5', icon: <Clock size={20} />, color: 'orange' },
    { label: 'Invoice Mismatch', value: '3', icon: <AlertCircle size={20} />, color: 'red' },
    { label: 'MTD Purchases', value: 'AED 182K', icon: <FileText size={20} />, color: 'green' },
  ];

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'In Transit': return 'in-transit';
      case 'Pending GRN': return 'pending-grn';
      case 'Completed': return 'completed';
      case 'Invoice Mismatch': return 'mismatch';
      default: return '';
    }
  };

  const getActionButton = (status: string) => {
    switch(status) {
      case 'In Transit': return <button className="btn-grn" onClick={() => showNotification("GRN Receiving started for PO")}>GRN Receive</button>;
      case 'Pending GRN': return <button className="btn btn-sm btn-outline" onClick={() => showNotification("Receipt processing...")}>Receive</button>;
      case 'Completed': return <button className="btn btn-sm btn-outline" onClick={() => showNotification("Invoice generated")}>Invoice</button>;
      case 'Invoice Mismatch': return <button className="btn-review" onClick={() => showNotification("Discrepancy report opened", "info")}>Review</button>;
      default: return null;
    }
  };

  return (
    <div className="procurement-container">
      <div className="procurement-header">
        <h1>Procurement</h1>
        <div className="procurement-actions">
          <button className="btn btn-outline flex-center gap-2" onClick={() => setShowSuppliersModal(true)}>
            <Users size={16} /> Suppliers
          </button>
          <button className="btn btn-outline flex-center gap-2" onClick={() => showNotification("Auto-Reorder Queue updated", "info")}>
            <RefreshCcw size={16} /> Auto-Reorder Queue
          </button>
          <button className="btn btn-primary flex-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create PO
          </button>
        </div>
      </div>

      <div className="procurement-metrics">
        {dashboardMetrics.map((m, idx) => (
          <div key={idx} className="metric-card procurement">
            <h3>{m.label}</h3>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="procurement-table-panel panel p-0">
        <div className="p-4 flex-between border-bottom">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Purchase Orders</h2>
          <div className="flex gap-2">
            <div className="search-bar" style={{ padding: '0.4rem 1rem' }}>
              <Search size={14} className="text-muted" />
              <input type="text" placeholder="Search POs..." style={{ fontSize: '0.8rem' }} />
            </div>
            <button className="btn btn-outline btn-sm"><Filter size={14} /> Filter</button>
          </div>
        </div>
        <table className="procurement-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Items</th>
              <th>Value</th>
              <th>Created</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po.id}>
                <td className="po-number">{po.poNumber}</td>
                <td className="supplier-name">{po.supplier}</td>
                <td>{po.items}</td>
                <td>AED {po.value.toLocaleString()}</td>
                <td>{po.created}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(po.status)}`}>
                    {po.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {getActionButton(po.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="flex-between mb-4">
              <h2>New Purchase Order</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); showNotification("Purchase Order Created Successfully"); }}>
              <div className="form-group">
                <label>Supplier</label>
                <select className="form-control" required>
                  <option value="">Select Vendor...</option>
                  <option>Gulf Pharma Dist.</option>
                  <option>Emirates MedSupply</option>
                  <option>Al Nahdi Pharma</option>
                </select>
              </div>
              <div className="form-group">
                <label>Inventory Item</label>
                <div className="search-bar" style={{ width: '100%' }}>
                  <Search size={16} className="text-muted" />
                  <input type="text" placeholder="Search medicines..." />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" className="form-control" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Expected Delivery</label>
                  <input type="date" className="form-control" />
                </div>
              </div>
              <div className="flex-end gap-2 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Draft</button>
                <button type="submit" className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Modal */}
      {showSuppliersModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
            <div className="flex-between mb-4">
              <h2>Trusted Suppliers</h2>
              <button className="btn-icon" onClick={() => setShowSuppliersModal(false)}><X size={20} /></button>
            </div>
            <div className="scroll-y-400">
               {[
                 { name: 'Gulf Pharma Dist.', type: 'Local', orders: 124, score: '98%' },
                 { name: 'Emirates MedSupply', type: 'Specialized', orders: 45, score: '95%' },
                 { name: 'Al Nahdi Pharma', type: 'Regional', orders: 89, score: '92%' }
               ].map((s, i) => (
                 <div key={i} className="panel mb-2 p-4 flex-between">
                    <div>
                      <h4 style={{ margin: 0 }}>{s.name}</h4>
                      <p className="text-muted text-sm">{s.type} · {s.orders} Orders</p>
                    </div>
                    <div className="text-success font-bold">{s.score} Reliablity</div>
                 </div>
               ))}
            </div>
            <button className="btn btn-outline w-full mt-4" onClick={() => showNotification("Add supplier flow not implemented", "info")}>Add New Supplier</button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast animate-fade-in ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <Clock size={18} />}
            {toast.message}
        </div>
      )}
    </div>
  );
}
