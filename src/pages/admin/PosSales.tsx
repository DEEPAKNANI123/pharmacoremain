import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, ScanLine, CreditCard, Banknote, Star, Plus, Minus, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import type { CartItem } from '../../context/DatabaseContext';
import './PosSales.css';

const QRScanner = lazy(() => import('../../components/QRScanner'));

export default function PosSales() {
  const { inventory, processSale, updateMedicine, addMedicine } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string | null>(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [newMedData, setNewMedData] = useState<{
    name: string;
    category: 'Prescription (Rx)' | 'OTC' | 'Cold Chain' | 'Controlled';
    price: string;
    stock: string;
  }>({
    name: '',
    category: 'OTC',
    price: '',
    stock: '10'
  });

  const filteredInventory = useMemo(() => {
    const filtered = inventory.filter(med => {
      const matchSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.batch.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchFilter = true;
      if (filter !== 'All') {
        if (filter === 'Prescription (Rx)') matchFilter = med.category === 'Prescription (Rx)';
        else matchFilter = med.category === filter;
      }

      return matchSearch && matchFilter;
    });

    return filtered.sort((a, b) => {
      if (a.id === lastScannedId) return -1;
      if (b.id === lastScannedId) return 1;
      return 0;
    });
  }, [inventory, searchTerm, filter, lastScannedId]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`🔔 [NOTIFICATION] ${type.toUpperCase()}: ${message}`);
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const addToCart = (med: any) => {
    if (med.stock <= 0) {
      showNotification(`Insufficient stock for ${med.name}`, 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) return prev;
        return prev.map(item => item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        medicineId: med.id, 
        quantity: 1, 
        price: med.price, 
        purchasePrice: med.purchasePrice,
        name: med.name, 
        category: med.category 
      }];
    });
  };

  const handleScan = async (decodedText: string) => {
    console.log("🔍 [SCANNER] Scanned text:", decodedText);
    const rawText = decodedText.trim();
    setIsScannerOpen(false);
    
    try {
      let data: any = null;
      try {
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed === 'object') {
          data = parsed;
        }
      } catch (e) {
        // Not JSON - normal case for plain barcodes
      }

      // 1. JSON-based Medicine Update or Identification
      if (data) {
        console.log("📦 [SCANNER] JSON object detected:", data);
        const skuValue = data.sku || data.Sku || data.SKU || data.id || data.Id || data.ID || data.barcode || data.Barcode;
        const searchKey = String(skuValue || '').trim();
        
        // Even if we don't have a SKU yet, we definitely want to pre-fill the form with what we have
        setNewMedData({
          name: data.name || data.Name || '',
          category: (data.category && ['OTC', 'Prescription (Rx)', 'Cold Chain', 'Controlled'].includes(data.category)) ? data.category : 'OTC',
          price: (data.price || data.Price) ? String(data.price || data.Price) : '',
          stock: (data.stock || data.Stock) ? String(data.stock || data.Stock) : '10'
        });

        if (searchKey) {
          const med = inventory.find(m => 
            String(m.sku).toLowerCase() === searchKey.toLowerCase() || 
            String(m.id).toLowerCase() === searchKey.toLowerCase()
          );
          
          if (med) {
            const updates: any = {};
            let hasUpdates = false;
            
            if (data.name) { updates.name = data.name; hasUpdates = true; }
            if (data.stock !== undefined) {
              const sCount = Number(data.stock);
              if (!isNaN(sCount)) { updates.stock = sCount; hasUpdates = true; }
            }
            if (data.price !== undefined) {
              const pValue = Number(data.price);
              if (!isNaN(pValue)) { updates.price = pValue; hasUpdates = true; }
            }
            if (data.batch) { updates.batch = data.batch; hasUpdates = true; }
            if (data.expiryDate) { updates.expiryDate = data.expiryDate; hasUpdates = true; }

            if (hasUpdates) {
              console.log("🔄 [SCANNER] Applying updates to DB:", updates);
              await updateMedicine(med.id, updates);
            }

            addToCart(med);
            setLastScannedId(med.id);
            showNotification(`${med.name} detected and added to cart`);
            return;
          } else {
            console.warn("⚠️ [SCANNER] Medicine not found for key:", searchKey);
            setUnrecognizedBarcode(searchKey);
            setIsQuickAdd(true); 
            return;
          }
        } else if (data.name) {
          // If we have a name but NO SKU, treat the whole raw string or a random ID as SKU
          const fallbackSku = `QR-${Math.floor(Math.random()*1000)}`;
          setUnrecognizedBarcode(fallbackSku);
          setIsQuickAdd(true);
          return;
        }
      }

      // 2. Plain Text or URL Handling
      console.log("📄 [SCANNER] Processing as plain text/URL");
      let sku = rawText;
      
      // Extract SKU from URLs if present
      if (sku.includes('/') && (sku.startsWith('http') || sku.includes('.'))) {
        const parts = sku.split('/');
        sku = parts[parts.length - 1] || parts[parts.length - 2];
        console.log("🔗 [SCANNER] Extracted SKU from URL:", sku);
      }

      const med = inventory.find(m => 
        String(m.sku).toLowerCase() === sku.toLowerCase() || 
        String(m.id).toLowerCase() === sku.toLowerCase() ||
        String(m.batch).toLowerCase() === sku.toLowerCase()
      );

      if (med) {
        addToCart(med);
        setLastScannedId(med.id);
        showNotification(`${med.name} added to cart`);
      } else {
        console.warn("⚠️ [SCANNER] Barcode not found:", sku);
        // RESET form for new unknown barcode
        setNewMedData({ name: '', category: 'OTC', price: '', stock: '10' });
        setUnrecognizedBarcode(sku);
        setIsQuickAdd(false); // Show the choice screen first for plain barcodes
      }
    } catch (err) {
      console.error("❌ [SCANNER] Critical error in handleScan:", err);
      showNotification("Scan error. Please check your data format.", 'error');
    }
  };

  const handleAssignBarcode = async (medId: string) => {
    if (!unrecognizedBarcode) return;
    try {
      await updateMedicine(medId, { sku: unrecognizedBarcode });
      const med = inventory.find(m => m.id === medId);
      if (med) {
        addToCart(med);
        setLastScannedId(medId);
        showNotification(`Barcode assigned to ${med.name} and added to cart`);
      }
      setUnrecognizedBarcode(null);
      setAssignSearchTerm('');
    } catch (e) {
      showNotification("Failed to assign barcode.", "error");
    }
  };

  const handleQuickAdd = async () => {
    if (!unrecognizedBarcode || !newMedData.name) return;
    try {
      const med = await addMedicine({
        name: newMedData.name,
        sku: unrecognizedBarcode,
        category: newMedData.category,
        batch: `BATCH-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: Number(newMedData.price) || 0,
        purchasePrice: (Number(newMedData.price) || 0) * 0.7,
        stock: Number(newMedData.stock) || 0,
        reorderPoint: 5,
        storage: 'Room temp',
        isPerishable: false
      });
      
      addToCart(med);
      setLastScannedId(med.id);
      showNotification(`${med.name} added as new product and added to cart`);
      setUnrecognizedBarcode(null);
      setIsQuickAdd(false);
      setNewMedData({ name: '', category: 'OTC', price: '', stock: '10' });
    } catch (e) {
      showNotification("Failed to add new medicine.", "error");
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.medicineId === id) {
          const medRecord = inventory.find(m => m.id === id);
          let newQty = item.quantity + delta;
          if (newQty < 1) return item; // Handled by Trash icon instead
          if (medRecord && newQty > medRecord.stock) newQty = medRecord.stock;
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== id));
  };

  const handleCheckout = async (method: 'Cash' | 'Card') => {
    if (cart.length === 0) return;
    try {
      const txnId = await processSale(cart, method);
      if (txnId) {
        setCart([]);
        showNotification(`Payment Received. Transaction ${txnId} completed!`);
      }
    } catch (error) {
      showNotification('Transaction failed. Please try again.', 'error');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  const getCategoryBadge = (category: string) => {
    if (category === 'Prescription (Rx)') return <span className="badge badge-warning" style={{ color: '#d97706', backgroundColor: '#fef3c7' }}>Rx</span>;
    if (category === 'OTC') return <span className="badge badge-success">OTC</span>;
    if (category === 'Cold Chain') return <span className="badge badge-info">Cold</span>;
    return <span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>Ctrl</span>;
  };

  return (
    <div className="pos-container">
      <div className="flex-between pos-header">
        <h1>Point of Sale</h1>
        <div className="pos-actions">
          <button className="btn btn-outline">Prescription Sale</button>
          <button className="btn btn-primary">+ New Transaction</button>
        </div>
      </div>

      <div className="pos-main">
        {notification && (
          <div className={`notification panel ${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="text-success" />
            ) : (
              <AlertTriangle size={20} className="text-danger" />
            )}
            <span>{notification.message}</span>
            <button 
              className="close-notification" 
              onClick={() => setNotification(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="pos-catalog">

          <div className="pos-search flex-between gap-3">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Scan barcode or search medicine name.." 
                className="large-input" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                  <X size={18} />
                </button>
              )}
            </div>
            <button className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Search</button>
            <button className="btn btn-outline" onClick={() => setIsScannerOpen(true)}><ScanLine size={18} /> Scan</button>
          </div>

          <div className="pos-categories">
            {['All', 'Prescription (Rx)', 'OTC', 'Cold Chain', 'Controlled'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="medicine-grid">
             {filteredInventory.map(med => {
               const formatExpiry = new Date(med.expiryDate).toLocaleDateString('en-GB', {month: '2-digit', year: 'numeric'});
               return (
                <div key={med.id} className="medicine-card panel" onClick={() => addToCart(med)}>
                  <div className="flex-between">
                    <h4>{med.name}</h4>
                  </div>
                  <p className="medicine-batch text-muted">Batch {med.batch.split('-')[1]} · Exp {formatExpiry}</p>
                  <p className="text-xs mb-1" style={{color: med.stock <= med.reorderPoint ? 'var(--color-danger)' : 'var(--color-text-light)'}}>
                    Stock: {med.stock} {med.stock <= med.reorderPoint && '(Low)'}
                  </p>
                  <div className="flex-between medicine-footer">
                    <span className="medicine-price">AED {med.price.toFixed(2)}</span>
                    {getCategoryBadge(med.category)}
                  </div>
                </div>
               );
             })}
             {filteredInventory.length === 0 && <p className="text-muted p-4">No medicines match your search.</p>}
          </div>
        </div>

        <div className="pos-cart panel">
          <div className="flex-between cart-header">
            <h4>Cart</h4>
            <button className="btn btn-outline" style={{ padding: '0.2rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setCart([])}>Clear</button>
          </div>

          <div className="cart-items" style={{ padding: cart.length > 0 ? '1rem' : '0' }}>
            {cart.length === 0 ? (
               <div className="flex-center" style={{ height: '100%', flexDirection: 'column' }}>
                  <span className="text-muted text-sm">Tap items to add to cart</span>
               </div>
            ) : (
              <div className="cart-item-list">
                {cart.map(item => (
                  <div key={item.medicineId} className="cart-item">
                    <div className="cart-item-details">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-price">AED {item.price.toFixed(2)}</p>
                    </div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => item.quantity > 1 ? updateQuantity(item.medicineId, -1) : removeFromCart(item.medicineId)}>
                        {item.quantity > 1 ? <Minus size={14} /> : <Trash2 size={14} className="text-danger" />}
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.medicineId, 1)}><Plus size={14} /></button>
                    </div>
                    <div className="cart-item-subtotal font-bold">
                      AED {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-summary text-sm">
              <div className="flex-between mb-1">
                <span className="text-muted">Subtotal</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex-between mb-2">
                <span className="text-muted">VAT (5%)</span>
                <span>AED {vat.toFixed(2)}</span>
              </div>
              <div className="flex-between cart-total">
                <span className="font-bold">Total</span>
                <span className="font-bold">AED {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-options">
              <button 
                className="btn btn-outline flex-1" 
                onClick={() => handleCheckout('Card')}
                disabled={cart.length === 0}
              >
                <CreditCard size={18} /> Card
              </button>
              <button 
                className="btn btn-primary flex-1" 
                onClick={() => handleCheckout('Cash')}
                disabled={cart.length === 0}
              >
                <Banknote size={18} /> Cash
              </button>
            </div>
            
            <button className="btn btn-outline btn-full mt-3">
              <Star size={16} className="text-warning" /> Reward Points
            </button>
          </div>
        </div>
      </div>
      {unrecognizedBarcode && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
            <div className="flex-between mb-4">
              <div>
                <h2 className="text-danger">{isQuickAdd ? 'Add New Product' : 'Unrecognized Barcode'}</h2>
                <p className="text-sm text-muted">Barcode: <strong>{unrecognizedBarcode}</strong></p>
              </div>
              <button className="btn-icon" onClick={() => { setUnrecognizedBarcode(null); setIsQuickAdd(false); }}><X size={20} /></button>
            </div>
            
            {isQuickAdd ? (
              <div className="quick-add-form">
                <div className="form-group">
                  <label>Medicine Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter full name"
                    value={newMedData.name}
                    onChange={e => setNewMedData({...newMedData, name: e.target.value})}
                    autoFocus
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      className="form-control"
                      value={newMedData.category}
                      onChange={e => setNewMedData({...newMedData, category: e.target.value as any})}
                    >
                      <option>OTC</option>
                      <option>Prescription (Rx)</option>
                      <option>Cold Chain</option>
                      <option>Controlled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sales Price (AED)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newMedData.price}
                      onChange={e => setNewMedData({...newMedData, price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newMedData.stock}
                    onChange={e => setNewMedData({...newMedData, stock: e.target.value})}
                  />
                </div>
                <div className="flex-between mt-4">
                  <button className="btn btn-outline" onClick={() => setIsQuickAdd(false)}>Back to Assign</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleQuickAdd}
                    disabled={!newMedData.name || !newMedData.price}
                  >
                    Save & Add to Cart
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm">This barcode is not in your inventory. You can assign it to an existing medicine or add it as a new product.</p>
                
                <div className="flex gap-2 mb-4">
                  <button 
                    className="btn btn-primary flex-1" 
                    onClick={() => setIsQuickAdd(true)}
                  >
                    + Add as New Medicine
                  </button>
                </div>

                <div className="divider mb-4"><span className="text-xs text-muted">OR ASSIGN TO EXISTING</span></div>

                <input 
                  type="text" 
                  className="form-control mb-4" 
                  placeholder="Search medicine name to assign..."
                  value={assignSearchTerm}
                  onChange={e => setAssignSearchTerm(e.target.value)}
                />

                <div className="assign-list scroll-y-400">
                  {inventory
                    .filter(m => m.name.toLowerCase().includes(assignSearchTerm.toLowerCase()))
                    .slice(0, 5)
                    .map(med => (
                      <div key={med.id} className="assign-item panel mb-2" onClick={() => handleAssignBarcode(med.id)}>
                        <div className="flex-between">
                          <div>
                            <strong>{med.name}</strong>
                            <p className="text-xs text-muted">Current SKU: {med.sku}</p>
                          </div>
                          <button className="btn btn-sm btn-primary">Assign</button>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isScannerOpen && (
        <Suspense fallback={<div className="qr-scanner-overlay"><div className="qr-scanner-modal">Loading scanner...</div></div>}>
          <QRScanner 
            onScan={handleScan}
            onClose={() => setIsScannerOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
