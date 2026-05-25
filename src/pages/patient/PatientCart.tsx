import React, { useState } from 'react';
import { ShoppingBag, Truck, CreditCard, ChevronRight, CheckCircle, MapPin, Clock, Wallet, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import './PatientCart.css';

export default function PatientCart() {
  const { currentUser, createOrder, cart, updateCartQuantity, removeFromCart, clearCart } = useDatabase();
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'success'>('cart');
  const [deliveryType, setDeliveryType] = useState<'Instant' | 'Scheduled' | 'Pickup'>('Instant');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card'>('COD');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vat = subtotal * 0.05;
  const deliveryFee = deliveryType === 'Instant' ? 10 : 0;
  const total = subtotal + vat + deliveryFee;

  const handleConfirmOrder = () => {
    createOrder({
      userId: currentUser?.id || 'GUEST',
      items: cart,
      subtotal,
      vat,
      total,
      deliveryType,
      paymentMethod
    });
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="checkout-success-view flex-center animate-fade-in" style={{ flexDirection: 'column', paddingTop: '5rem' }}>
        <div className="panel flex-center shadow-lg" style={{ width: 140, height: 140, borderRadius: '50%', background: '#dcfce7', marginBottom: '2.5rem', border: '8px solid white' }}>
           <CheckCircle size={72} className="text-success" />
        </div>
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Order Confirmed!</h1>
        <p className="text-muted text-xl mb-12 text-center max-w-lg">Your healthcare essentials are being prepared. You can track your rider and live updates in your profile.</p>
        <div className="flex gap-6">
            <button className="btn btn-primary px-10 py-4 text-lg font-bold shadow-blue" onClick={() => window.location.href='/patient/profile'}>Track Live Status</button>
            <button className="btn btn-outline px-10 py-4 text-lg font-bold" onClick={() => window.location.href='/patient/search'}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && step === 'cart') {
    return (
        <div className="cart-empty flex-center py-24" style={{ flexDirection: 'column' }}>
            <div className="mb-8 opacity-10"><ShoppingBag size={120} /></div>
            <h2 className="text-3xl font-bold mb-3">Your bag is empty</h2>
            <p className="text-muted mb-10 text-center max-w-sm text-lg">Add some health essentials to your bag to get started with your order.</p>
            <button className="btn btn-primary px-12 py-4 text-lg font-bold" onClick={() => window.location.href='/patient/search'}>Explore Store</button>
        </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="checkout-steps-horizontal">
         <StepNode num={1} label="Bag" status={step === 'cart' ? 'active' : 'completed'} />
         <StepNode num={2} label="Delivery" status={step === 'delivery' ? 'active' : (step === 'payment' ? 'completed' : 'pending')} />
         <StepNode num={3} label="Payment" status={step === 'payment' ? 'active' : 'pending'} />
      </div>

      <div className="checkout-page-layout">
        <div className="checkout-main-area">
          {step === 'cart' && (
            <div className="panel-group">
               <div className="section-header mb-4">
                  <h2 className="text-2xl font-bold">Shopping Bag</h2>
                  <p className="text-muted text-sm">{cart.length} Items in your bag</p>
               </div>
               <div className="cart-list">
                  {cart.map(item => (
                    <div key={item.medicineId} className="patient-cart-item panel">
                      <div className="item-img-min flex-center">
                         <div style={{ color: 'var(--color-primary)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path></svg>
                         </div>
                      </div>
                      <div className="item-details flex-1">
                        <div className="flex-between">
                            <h4 className="text-xl font-bold">{item.name}</h4>
                            <button className="text-danger bg-transparent border-none font-bold cursor-pointer" onClick={() => removeFromCart(item.medicineId)}>Remove</button>
                        </div>
                        <p className="text-sm text-muted mb-4 opacity-60">{item.category} • {item.quantity > 1 ? 'Multi-pack' : 'Single Item'}</p>
                        <div className="flex-between items-end">
                            <div className="qty-controls-mini">
                                <button onClick={() => updateCartQuantity(item.medicineId, -1)} disabled={item.quantity <= 1}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateCartQuantity(item.medicineId, 1)}>+</button>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted mb-1">Unit Price: AED {item.price.toFixed(2)}</p>
                                <span className="text-2xl font-black text-main">AED {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {step === 'delivery' && (
            <div className="panel-group">
               <button className="flex-center gap-2 btn-text mb-4" onClick={() => setStep('cart')}><ArrowLeft size={16}/> Back to Bag</button>
               <h2 className="text-2xl font-bold mb-6">Delivery Options</h2>
               <div className="delivery-grid">
                  <DeliveryOption 
                    active={deliveryType === 'Instant'} 
                    onClick={() => setDeliveryType('Instant')}
                    icon={<Truck size={32} />}
                    title="Instant"
                    desc="30-45 Minutes"
                    price="AED 10.00"
                  />
                  <DeliveryOption 
                    active={deliveryType === 'Scheduled'} 
                    onClick={() => setDeliveryType('Scheduled')}
                    icon={<Clock size={32} />}
                    title="Scheduled"
                    desc="Pick your time"
                    price="FREE"
                  />
                  <DeliveryOption 
                    active={deliveryType === 'Pickup'} 
                    onClick={() => setDeliveryType('Pickup')}
                    icon={<MapPin size={32} />}
                    title="Self Pickup"
                    desc="Nearby Branch"
                    price="FREE"
                  />
               </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="panel-group">
                <button className="flex-center gap-2 btn-text mb-4" onClick={() => setStep('delivery')}><ArrowLeft size={16}/> Back to Delivery</button>
                <h2 className="text-2xl font-bold mb-6">Choose Payment Method</h2>
                <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div className={`option-card panel ${paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setPaymentMethod('COD')}>
                      <Wallet size={32} className="mb-4" />
                      <h4 className="font-bold">Cash on Delivery</h4>
                      <p className="text-xs text-muted">Pay at doorstep</p>
                   </div>
                   <div className={`option-card panel ${paymentMethod === 'Card' ? 'active' : ''}`} onClick={() => setPaymentMethod('Card')}>
                      <CreditCard size={32} className="mb-4" />
                      <h4 className="font-bold">Online Payment</h4>
                      <p className="text-xs text-muted">Secure transaction</p>
                   </div>
                </div>
            </div>
          )}
        </div>

        <div className="summary-sidebar">
           <div className="panel" style={{ padding: '2rem' }}>
              <h3 className="text-lg font-bold mb-6">Order Summary</h3>
              <div className="flex-column gap-3 mb-6" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                 <div className="flex-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold">AED {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex-between text-sm">
                    <span className="text-muted">VAT (5%)</span>
                    <span className="font-bold">AED {vat.toFixed(2)}</span>
                 </div>
                 <div className="flex-between text-sm">
                    <span className="text-muted">Delivery Fee</span>
                    <span className="font-bold">{deliveryFee > 0 ? `AED ${deliveryFee.toFixed(2)}` : 'FREE'}</span>
                 </div>
              </div>
              <div className="flex-between mb-8">
                 <span className="text-xl font-bold">Total</span>
                 <span className="text-2xl font-bold text-primary">AED {total.toFixed(2)}</span>
              </div>

              {step === 'cart' && <button className="btn btn-primary btn-full py-4 text-lg" onClick={() => setStep('delivery')}>Checkout Now <ChevronRight size={20} /></button>}
              {step === 'delivery' && <button className="btn btn-primary btn-full py-4 text-lg" onClick={() => setStep('payment')}>Continue to Payment <ChevronRight size={20} /></button>}
              {step === 'payment' && <button className="btn btn-primary btn-full py-4 text-lg" onClick={handleConfirmOrder}>Finalize Order — AED {total.toFixed(2)}</button>}
              
              <div className="flex-center gap-2 mt-6 text-xs text-muted">
                 <ShieldCheck size={16} className="text-success" />
                 <span>Secure Checkout Powered by PharmaCore</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StepNode({ num, label, status }: any) {
    return (
        <div className={`step-node ${status}`}>
            <div className="step-num">{num}</div>
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
    );
}

function DeliveryOption({ active, onClick, icon, title, desc, price }: any) {
    return (
        <div className={`option-card panel ${active ? 'active' : ''}`} onClick={onClick}>
            <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
            <h4 className="text-md font-bold mt-4">{title}</h4>
            <p className="text-xs text-muted mb-2">{desc}</p>
            <span className="text-sm font-bold text-primary">{price}</span>
        </div>
    );
}
