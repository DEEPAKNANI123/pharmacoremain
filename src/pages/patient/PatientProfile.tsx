import React, { useState } from 'react';
import { User, MapPin, Users, Package, ChevronRight, Phone, Mail, Clock, CreditCard, Shield, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import './PatientProfile.css';

export default function PatientProfile() {
  const { currentUser, orders } = useDatabase();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'payments'>('profile');

  const userOrders = orders.filter(o => o.userId === currentUser?.id);

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-sidebar">
         <div className="panel profile-hero">
            <div className="avatar-large flex-center">
              <User size={48} className="text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">{currentUser?.name || 'Guest User'}</h2>
            <p className="text-muted text-sm mb-6">{currentUser?.email}</p>
            <div className="badge badge-primary-light">Vip Member</div>
         </div>

         <div className="profile-nav-tabs">
            <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
               <User size={20} /> My Profile
            </button>
            <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
               <Package size={20} /> Order History
            </button>
            <button className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
               <MapPin size={20} /> Saved Addresses
            </button>
            <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
               <CreditCard size={20} /> Payment Methods
            </button>
         </div>
      </div>

      <div className="tab-content-area">
         {activeTab === 'profile' && <AccountDetails currentUser={currentUser} />}
         {activeTab === 'orders' && <OrderHistory userOrders={userOrders} />}
         {(activeTab === 'addresses' || activeTab === 'payments') && (
             <div className="flex-center py-20 opacity-50" style={{ flexDirection: 'column' }}>
                 <Clock size={64} className="mb-4" />
                 <h2 className="text-2xl font-bold">Coming Soon</h2>
                 <p>We are working on this feature!</p>
             </div>
         )}
      </div>
    </div>
  );
}

function AccountDetails({ currentUser }: any) {
    return (
        <div className="account-settings animate-slide-up">
            <div className="section-header mb-10">
                <h2 className="text-3xl font-bold">Account Settings</h2>
                <p className="text-muted text-lg mt-2">Manage your personal information and preferences.</p>
            </div>

            <div className="account-details-grid">
                <DetailCard icon={<Mail size={24} />} label="Email Address" value={currentUser?.email || ''} />
                <DetailCard icon={<Phone size={24} />} label="Phone Number" value="+971 50 123 4567" />
            </div>

            <div className="shipping-box panel p-8 mt-10">
                <div className="flex-between mb-4">
                    <div className="flex-center gap-2">
                        <MapPin size={20} className="text-primary" />
                        <span className="font-bold">Shipping Address</span>
                    </div>
                    <button className="btn-text">Edit</button>
                </div>
                <p className="text-muted leading-relaxed">123 Health St, Silicon Oasis, Dubai, UAE</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-10">
                <div className="panel p-6">
                    <div className="flex-center gap-3 mb-2">
                        <Users size={20} className="text-primary" />
                        <span className="font-medium text-sm">Family Members</span>
                    </div>
                    <p className="text-2xl font-bold">0 Registered Citizens</p>
                </div>
                <div className="panel p-6">
                    <div className="flex-center gap-3 mb-2">
                        <Shield size={20} className="text-primary" />
                        <span className="font-medium text-sm">Security</span>
                    </div>
                    <p className="text-2xl font-bold">Two-Factor Enabled</p>
                </div>
            </div>
        </div>
    );
}

function OrderHistory({ userOrders }: any) {
    return (
        <div className="order-history animate-slide-up">
            <div className="section-header mb-10">
                <h2 className="text-3xl font-bold">Order History</h2>
                <p className="text-muted text-lg mt-2">Track and manage your recent prescriptions and orders.</p>
            </div>
            
            {userOrders.length === 0 ? (
                <div className="flex-center py-20" style={{ flexDirection: 'column', opacity: 0.5 }}>
                    <Package size={64} className="mx-auto mb-4" />
                    <p className="text-xl font-bold">No orders found yet</p>
                    <button className="btn btn-primary mt-6 px-10 py-3" onClick={() => window.location.href='/patient/search'}>Place Your First Order</button>
                </div>
            ) : (
                <div className="order-list">
                    {userOrders.map((order: any) => (
                        <div key={order.id} className="order-history-card">
                            <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Order ID: {order.id}</p>
                                    <p className="text-sm text-muted">Ordered on {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`status-pill status-${order.status.toLowerCase().replace(/ /g, '-')}`}>
                                        {order.status}
                                    </div>
                                    <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-widest">{order.deliveryType} Delivery</p>
                                </div>
                            </div>

                            <div className="tracking-visual-desktop mb-8">
                                <TrackingStep label="Placed" active={true} completed={true} />
                                <TrackingStep label="Processing" active={order.status !== 'Order Placed'} completed={['Packed', 'Out for Delivery', 'Delivered'].includes(order.status)} />
                                <TrackingStep label="Out for Delivery" active={['Out for Delivery', 'Delivered'].includes(order.status)} completed={order.status === 'Delivered'} />
                                <TrackingStep label="Delivered" active={order.status === 'Delivered'} completed={order.status === 'Delivered'} />
                            </div>

                            <div className="flex-between pt-6 mt-8" style={{ borderTop: '1px solid #e2e8f0', background: 'white', margin: '0 -2.5rem', padding: '1.5rem 2.5rem', borderRadius: '0 0 20px 20px' }}>
                                <div className="text-sm">
                                    <span className="text-muted">Total amount: </span>
                                    <span className="font-bold text-lg">AED {order.total.toFixed(2)}</span>
                                </div>
                                <button className="btn btn-outline px-6 py-2 text-sm font-bold">View Receipt</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailCard({ icon, label, value }: any) {
    return (
        <div className="panel p-6 flex-column gap-2 bg-white hover-scale">
            <div className="flex-center gap-2 text-muted uppercase text-[10px] font-bold tracking-wider">
                {icon} {label}
            </div>
            <p className="text-lg font-bold text-main">{value}</p>
        </div>
    );
}

function TrackingStep({ label, active, completed }: any) {
    return (
        <div className={`track-node ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
            <div className="track-circle">
                {completed ? <CheckCircle2 size={16} /> : <div className="dot" />}
            </div>
            <span className="track-label">{label}</span>
        </div>
    );
}
