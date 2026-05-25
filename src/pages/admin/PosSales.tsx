import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, ScanLine, CreditCard, Banknote, Star, Plus, Minus, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import type { CartItem } from '../../context/DatabaseContext';
import './PosSales.css';

const QRScanner = lazy(() => import('../../components/QRScanner'));

export default function PosSales() {
  const { inventory, processSale, updateMedicine } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

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
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
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
    setIsScannerOpen(false);
    try {
      const data = JSON.parse(decodedText);
      if (data.sku) {
        const med = inventory.find(m => m.sku === data.sku);
        if (med) {
          // If JSON contains updates, apply them first
          const updates: any = {};
          let hasUpdates = false;
          if (data.name) { updates.name = data.name; hasUpdates = true; }
          if (data.stock) { updates.stock = data.stock; hasUpdates = true; }
          if (data.price) { updates.price = data.price; hasUpdates = true; }
          if (data.batch) { updates.batch = data.batch; hasUpdates = true; }
          if (data.expiryDate) { updates.expiryDate = data.expiryDate; hasUpdates = true; }

          if (hasUpdates) {
            await updateMedicine(med.id, updates);
          }

          // Then add to cart
          addToCart(med);
          setLastScannedId(med.id);
          showNotification(`${med.name} added to cart`);
        } else {
          showNotification(`Medicine with SKU ${data.sku} not found.`, 'error');
        }
      }
    } catch (e) {
      // Not JSON, assume plain SKU barcode
      const med = inventory.find(m => m.sku === decodedText || m.id === decodedText);
      if (med) {
        addToCart(med);
        setLastScannedId(med.id);
        showNotification(`${med.name} added to cart`);
      } else {
        showNotification(`Barcode ${decodedText} not found.`, 'error');
      }
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
        <div className="pos-catalog">
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
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Search, ScanLine, CreditCard, Banknote, Star, Plus, Minus, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import type { CartItem } from '../../context/DatabaseContext';
import './PosSales.css';

const QRScanner = lazy(() => import('../../components/QRScanner'));

export default function PosSales() {
  const { inventory, processSale, updateMedicine } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

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
        const skuValue = data.sku || data.Sku || data.SKU || data.id || data.Id || data.ID;
        const searchKey = String(skuValue || '').trim();
        
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
            return; // Early exit on success
          } else {
            console.warn("⚠️ [SCANNER] Medicine not found for key:", searchKey);
            showNotification(`Product with key ${searchKey} not in inventory.`, 'error');
            return;
          }
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
        String(m.id).toLowerCase() === sku.toLowerCase()
      );

      if (med) {
        addToCart(med);
        setLastScannedId(med.id);
        showNotification(`${med.name} added to cart`);
      } else {
        console.warn("⚠️ [SCANNER] Barcode not found:", sku);
        showNotification(`Barcode [${sku}] not recognized.`, 'error');
      }
    } catch (err) {
      console.error("❌ [SCANNER] Critical error in handleScan:", err);
      showNotification("Scan error. Please check your data format.", 'error');
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
