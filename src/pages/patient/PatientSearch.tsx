import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Minus, ShoppingBag, Info, Star, ShieldCheck } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import './PatientSearch.css';

export default function PatientSearch() {
  const { inventory, addToCart } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const filtered = useMemo(() => {
    return inventory.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(m => m.category !== 'Controlled');
  }, [inventory, searchTerm]);

  const handleAddToCart = () => {
    if (selectedMed) {
        addToCart(selectedMed, qty);
        setSelectedMed(null);
        setQty(1);
    }
  };

  const fastAddToCart = (e: React.MouseEvent, med: any) => {
    e.stopPropagation();
    addToCart(med, 1);
  };

  return (
    <div className="patient-search-container">
      <div className="search-header">
        <div className="search-bar">
          <Search size={22} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search for medicines, vitamins, wellness products..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="section-header mb-6">
          <h2 className="text-xl font-bold">Recommended for You</h2>
          <p className="text-sm text-muted">Showing {filtered.length} products</p>
      </div>

      <div className="search-results">
        {filtered.map(med => (
          <div key={med.id} className="med-result-card panel" onClick={() => { setSelectedMed(med); setQty(1); }}>
            <div className="med-img-placeholder">
              <PillIcon category={med.category} size={64} />
            </div>
            <div className="med-info">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{med.category}</p>
              <h4 className="text-md font-bold text-main line-clamp-1">{med.name}</h4>
              <div className="flex-center gap-1 mt-1 mb-3">
                 {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />)}
                 <span className="text-[10px] text-muted ml-1">(4.8)</span>
              </div>
              <div className="flex-between">
                <span className="text-lg font-bold text-main">AED {med.price.toFixed(2)}</span>
                <button className="add-small" onClick={(e) => fastAddToCart(e, med)}><Plus size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMed && (
        <div className="med-details-overlay" onClick={() => setSelectedMed(null)}>
           <div className="med-details-panel animate-slide-up" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedMed(null)}><X size={20} /></button>
              
              <div className="med-details-left">
                 <div className="flex-center" style={{ flexDirection: 'column' }}>
                    <PillIcon category={selectedMed.category} size={120} />
                    <div className="mt-8 flex gap-2">
                       <div className="panel" style={{ width: 80, height: 80, border: '2px solid var(--color-primary)' }}></div>
                       <div className="panel" style={{ width: 80, height: 80 }}></div>
                    </div>
                 </div>
              </div>

              <div className="med-details-right">
                 <div className="badge badge-primary-light mb-4">{selectedMed.category}</div>
                 <h1 className="text-3xl font-bold text-main mb-2">{selectedMed.name}</h1>
                 <div className="flex-center gap-2 mb-6">
                    <div className="flex gap-1">
                       {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
                    </div>
                    <span className="text-sm text-muted">124 Reviews</span>
                 </div>

                 <p className="text-muted mb-8 leading-relaxed">
                    PharmaCore certified medication. This product is stored in a {selectedMed.storage.toLowerCase()} environment to ensure maximum efficacy and safety.
                 </p>

                 <div className="flex-between mb-8 pb-8" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <span className="text-4xl font-bold text-main">AED {selectedMed.price.toFixed(2)}</span>
                    <div className="qty-selector" style={{ background: '#f8fafc', padding: '0.75rem 1.5rem', borderRadius: '16px', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                       <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Minus size={20} /></button>
                       <span className="font-bold text-lg">{qty}</span>
                       <button onClick={() => setQty(q => q+1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={20} /></button>
                    </div>
                 </div>

                 <div className="flex-column gap-4">
                    <button className="btn btn-primary btn-full py-4 flex-center gap-3 text-lg" onClick={handleAddToCart}>
                       <ShoppingBag size={24} /> Add to Cart — AED {(selectedMed.price * qty).toFixed(2)}
                    </button>
                    <div className="flex-center gap-4 mt-6">
                       <div className="flex-center gap-2 text-xs text-muted">
                          <ShieldCheck size={16} className="text-success" />
                          <span>Genuine Product</span>
                       </div>
                       <div className="flex-center gap-2 text-xs text-muted">
                          <Star size={16} className="text-success" />
                          <span>Free Consultation</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function PillIcon({ category, size = 24 }: { category: string, size?: number }) {
  const color = category === 'Cold Chain' ? '#3b82f6' : '#ef4444';
  return <div style={{ color }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>
  </div>;
}
