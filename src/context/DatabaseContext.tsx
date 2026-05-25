import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Medicine } from '../data/medicinesDB';
import { defaultMedicines } from '../data/medicinesDB';

export interface CartItem {
  medicineId: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  name: string;
  category: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'patient';
  name: string;
  address?: string;
  phone?: string;
  familyMembers?: string[];
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: 'Order Placed' | 'Processing' | 'Packed' | 'Out for Delivery' | 'Delivered';
  deliveryType: 'Instant' | 'Scheduled' | 'Pickup';
  paymentMethod: 'COD' | 'Card';
  date: string;
}

export interface RxSubmission {
  id: string;
  userId: string;
  imageUrl: string;
  date: string;
  status: 'Reviewing' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  associatedMedicines?: string[];
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: 'Cash' | 'Card';
}

interface DatabaseContextType {
  inventory: Medicine[];
  transactions: Transaction[];
  users: User[];
  orders: Order[];
  rxQueue: RxSubmission[];
  currentUser: User | null;
  cart: CartItem[];
  isLoading: boolean;
  isOffline: boolean;
  addToCart: (medicine: Medicine, quantity: number) => void;
  updateCartQuantity: (medicineId: string, delta: number) => void;
  removeFromCart: (medicineId: string) => void;
  clearCart: () => void;
  processSale: (cartItems: CartItem[], paymentMethod: 'Cash' | 'Card') => Promise<string | null>;
  createOrder: (orderData: Omit<Order, 'id' | 'date' | 'status'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  submitPrescription: (imageUrl: string) => Promise<void>;
  updateRxStatus: (rxId: string, status: RxSubmission['status'], reason?: string, medIds?: string[]) => Promise<void>;
  signup: (userData: Omit<User, 'id'>, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  reviewedAlerts: string[];
  markAlertAsReviewed: (id: string) => void;
  markAllAlertsAsReviewed: (ids: string[]) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<Medicine>;
  receiveStock: (id: string, quantity: number) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Sample Credentials
const SAMPLE_ADMIN = { email: 'admin@pharmacy.com', password: 'admin123' };
const SAMPLE_PATIENT = { email: 'patient@example.com', password: 'patient123' };

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rxQueue, setRxQueue] = useState<RxSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reviewedAlerts, setReviewedAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Initialize from Supabase or Fallback to Sample
  useEffect(() => {
    const initData = async () => {
      console.log('🔄 DatabaseContext: Starting data initialization...');
      setIsLoading(true);
      
      try {
        // 1. Session Check (with safety timeout)
        console.log('📡 Checking Supabase session...');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 3000));
        
        const { data: sessionData }: any = await Promise.race([sessionPromise, timeoutPromise]);
        const session = sessionData?.session;

        if (session?.user) {
          console.log('👤 Authenticated user found:', session.user.email);
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setCurrentUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              address: profile.address,
              phone: profile.phone,
              familyMembers: profile.family_members
            });
          }
        } else {
            console.log('ℹ️ No active Supabase session.');
            const savedSampleUser = localStorage.getItem('pharma_sample_user');
            if (savedSampleUser) {
                console.log('🧪 Using saved Sample User profile.');
                setCurrentUser(JSON.parse(savedSampleUser));
                setIsOffline(true);
            }
        }

        // 2. Fetch Inventory
        console.log('📦 Fetching medicines from Supabase...');
        const { data: medicines, error: invError } = await supabase
          .from('medicines')
          .select('*')
          .order('name');
        
        if (invError) {
          console.error('❌ Supabase Inventory Error:', invError.message);
          throw invError;
        }
        
        if (medicines && medicines.length > 0) {
          console.log(`✅ Fetched ${medicines.length} medicines from Supabase.`);
          const mappedInventory: Medicine[] = medicines.map(m => ({
            id: m.id,
            name: m.name,
            sku: m.sku,
            category: m.category,
            batch: m.batch,
            expiryDate: m.expiry_date,
            price: m.price,
            purchasePrice: m.purchase_price,
            stock: m.stock,
            reorderPoint: m.reorder_point,
            storage: m.storage,
            isPerishable: m.is_perishable
          }));
          setInventory(mappedInventory);
          setIsOffline(false);
        } else {
          console.warn('⚠️ Supabase returned 0 medicines. Falling back to local data.');
          throw new Error('No data in Supabase');
        }

        // 3. Fetch Orders & Transactions (Non-blocking)
        console.log('📊 Fetching sales history...');
        const [ordersRes, txRes] = await Promise.all([
          supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
          supabase.from('transactions').select('*, transaction_items(*)').order('created_at', { ascending: false })
        ]);
        
        if (ordersRes.data) {
          setOrders(ordersRes.data.map(o => ({
            id: o.id,
            userId: o.user_id,
            items: o.order_items.map((oi: any) => ({
              medicineId: oi.medicine_id,
              quantity: oi.quantity,
              price: oi.price,
              purchasePrice: oi.purchase_price,
              name: oi.name,
              category: oi.category
            })),
            subtotal: o.subtotal,
            vat: o.vat,
            total: o.total,
            status: o.status,
            deliveryType: o.delivery_type,
            paymentMethod: o.payment_method,
            date: o.created_at
          })));
        }

        if (txRes.data) {
          setTransactions(txRes.data.map(t => ({
            id: t.id,
            date: t.created_at,
            items: t.transaction_items.map((ti: any) => ({
              medicineId: ti.medicine_id,
              quantity: ti.quantity,
              price: ti.price,
              purchasePrice: ti.purchase_price,
              name: ti.name,
              category: ti.category
            })),
            subtotal: t.subtotal,
            vat: t.vat,
            total: t.total,
            paymentMethod: t.payment_method
          })));
        }
      } catch (err: any) {
        console.error('🚨 CONNECTION FAILED - Switching to Sample/Local Mode:', err.message || err);
        setIsOffline(true);
        
        // Load default mock data
        const savedInv = localStorage.getItem('pharma_inventory');
        const finalInv = savedInv ? JSON.parse(savedInv) : defaultMedicines;
        console.log(`🏠 Loaded ${finalInv.length} medicines from local storage/defaults.`);
        setInventory(finalInv);
        
        const savedOrders = localStorage.getItem('pharma_orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        const savedTx = localStorage.getItem('pharma_transactions');
        if (savedTx) setTransactions(JSON.parse(savedTx));
      } finally {
        const savedCart = localStorage.getItem('pharma_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
        
        const savedReviewed = localStorage.getItem('pharma_reviewed_alerts');
        if (savedReviewed) setReviewedAlerts(JSON.parse(savedReviewed));
        
        setIsLoading(false);
      }
    };

    initData();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setCurrentUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            address: profile.address,
            phone: profile.phone,
            familyMembers: profile.family_members
          });
          setIsOffline(false);
        }
      } else if (!isOffline) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (medicine: Medicine, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === medicine.id);
      let updated;
      if (existing) {
        updated = prev.map(item => item.medicineId === medicine.id ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
        updated = [...prev, {
          medicineId: medicine.id,
          quantity,
          price: medicine.price,
          purchasePrice: medicine.purchasePrice,
          name: medicine.name,
          category: medicine.category
        }];
      }
      localStorage.setItem('pharma_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCartQuantity = (medicineId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => item.medicineId === medicineId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
      localStorage.setItem('pharma_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.medicineId !== medicineId);
      localStorage.setItem('pharma_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('pharma_cart');
  };

  const processSale = async (cartItems: CartItem[], paymentMethod: 'Cash' | 'Card') => {
    if (cartItems.length === 0) return null;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;
    const date = new Date().toISOString();

    if (!isOffline) {
      try {
        const { data: tx } = await supabase.from('transactions').insert({ subtotal, vat, total, payment_method: paymentMethod }).select().single();
        if (tx) {
          await supabase.from('transaction_items').insert(cartItems.map(item => ({ transaction_id: tx.id, medicine_id: item.medicineId, name: item.name, quantity: item.quantity, price: item.price, purchase_price: item.purchasePrice })));
          for (const item of cartItems) {
            const med = inventory.find(m => m.id === item.medicineId);
            if (med) await supabase.from('medicines').update({ stock: Math.max(0, med.stock - item.quantity) }).eq('id', med.id);
          }
          const { data: updatedMed } = await supabase.from('medicines').select('*');
          if (updatedMed) setInventory(updatedMed);
          return tx.id;
        }
      } catch (err) { console.error('Sale sync failed, using local only:', err); }
    }

    // Local Logic (Offline/Sample)
    const newTx: Transaction = { id: `SAMPLE-TXN-${Date.now()}`, date, items: cartItems, subtotal, vat, total, paymentMethod };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('pharma_transactions', JSON.stringify(updated));
      return updated;
    });
    setInventory(prev => {
      const updated = prev.map(med => {
        const cartItem = cartItems.find(item => item.medicineId === med.id);
        return cartItem ? { ...med, stock: Math.max(0, med.stock - cartItem.quantity) } : med;
      });
      localStorage.setItem('pharma_inventory', JSON.stringify(updated));
      return updated;
    });
    return newTx.id;
  };

  const signup = async (userData: Omit<User, 'id'>, password: string) => {
    if (userData.email.includes('sample') || userData.email.includes('pharmacy.com')) return true;
    const { data, error } = await supabase.auth.signUp({ email: userData.email, password: password, options: { data: { name: userData.name, role: userData.role } } });
    if (error) { console.error('Signup Error:', error); throw error; }
    const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user!.id, email: userData.email, name: userData.name, role: userData.role });
    if (profileError) throw profileError;
    return true;
  };

  const login = async (email: string, password: string) => {
    // 1. Sample Bypass
    if (email === SAMPLE_ADMIN.email && password === SAMPLE_ADMIN.password) {
      const user: User = { id: 'SAMPLE-ADMIN', email: email, name: 'Sample Pharmacist', role: 'admin' };
      setCurrentUser(user);
      localStorage.setItem('pharma_sample_user', JSON.stringify(user));
      setIsOffline(true);
      return user;
    }
    if (email === SAMPLE_PATIENT.email && password === SAMPLE_PATIENT.password) {
      const user: User = { id: 'SAMPLE-PATIENT', email: email, name: 'Sample Patient', role: 'patient' };
      setCurrentUser(user);
      localStorage.setItem('pharma_sample_user', JSON.stringify(user));
      setIsOffline(true);
      return user;
    }

    // 2. Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { console.error('Login Error:', error); throw error; }
    if (!data.user) return null;
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (pErr) throw pErr;
    if (profile) {
      const user: User = { id: profile.id, email: profile.email, name: profile.name, role: profile.role, address: profile.address, phone: profile.phone, familyMembers: profile.family_members };
      setCurrentUser(user);
      localStorage.removeItem('pharma_sample_user');
      setIsOffline(false);
      return user;
    }
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('pharma_sample_user');
    setIsOffline(false);
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const date = new Date().toISOString();
    if (!isOffline) {
        try {
            const { data: order } = await supabase.from('orders').insert({ user_id: orderData.userId, delivery_type: orderData.deliveryType, payment_method: orderData.paymentMethod, subtotal: orderData.subtotal, vat: orderData.vat, total: orderData.total }).select().single();
            if (order) {
                await supabase.from('order_items').insert(orderData.items.map(item => ({ order_id: order.id, medicine_id: item.medicineId, name: item.name, quantity: item.quantity, price: item.price, purchase_price: item.purchasePrice })));
                return order.id;
            }
        } catch (e) { console.error('Order sync failed:', e); }
    }
    const newOrder: Order = { ...orderData, id: `SAMPLE-ORD-${Date.now()}`, date, status: 'Order Placed' };
    setOrders(prev => {
        const updated = [newOrder, ...prev];
        localStorage.setItem('pharma_orders', JSON.stringify(updated));
        return updated;
    });
    return newOrder.id;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!isOffline) await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => {
        const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
        if (isOffline) localStorage.setItem('pharma_orders', JSON.stringify(updated));
        return updated;
    });
  };

  const submitPrescription = async (imageUrl: string) => {
    if (!currentUser) return;
    if (!isOffline) await supabase.from('rx_submissions').insert({ user_id: currentUser.id, image_url: imageUrl, status: 'Reviewing' });
    const newRx: RxSubmission = { id: `SAMPLE-RX-${Date.now()}`, userId: currentUser.id, imageUrl, date: new Date().toISOString(), status: 'Reviewing' };
    setRxQueue(prev => {
        const updated = [newRx, ...prev];
        if (isOffline) localStorage.setItem('pharma_rx_submissions', JSON.stringify(updated));
        return updated;
    });
  };

  const updateRxStatus = async (rxId: string, status: RxSubmission['status'], reason?: string, medIds?: string[]) => {
    if (!isOffline) await supabase.from('rx_submissions').update({ status, rejection_reason: reason, associated_medicines: medIds }).eq('id', rxId);
    setRxQueue(prev => {
        const updated = prev.map(rx => rx.id === rxId ? { ...rx, status, rejectionReason: reason, associatedMedicines: medIds } : rx);
        if (isOffline) localStorage.setItem('pharma_rx_submissions', JSON.stringify(updated));
        return updated;
    });
  };

  const resetDatabase = async () => {
    localStorage.clear();
    window.location.reload();
  };

  const markAlertAsReviewed = (id: string) => {
    setReviewedAlerts(prev => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem('pharma_reviewed_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAlertsAsReviewed = (ids: string[]) => {
    setReviewedAlerts(prev => {
      const updated = [...new Set([...prev, ...ids])];
      localStorage.setItem('pharma_reviewed_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
    const medIndex = inventory.findIndex(m => m.id === id);
    if (medIndex === -1) return;

    // Convert camelCase to snake_case for Supabase
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.sku !== undefined) supabaseUpdates.sku = updates.sku;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    if (updates.batch !== undefined) supabaseUpdates.batch = updates.batch;
    if (updates.price !== undefined) supabaseUpdates.price = updates.price;
    if (updates.purchasePrice !== undefined) supabaseUpdates.purchase_price = updates.purchasePrice;
    if (updates.stock !== undefined) supabaseUpdates.stock = updates.stock;
    if (updates.reorderPoint !== undefined) supabaseUpdates.reorder_point = updates.reorderPoint;
    if (updates.storage !== undefined) supabaseUpdates.storage = updates.storage;
    if (updates.isPerishable !== undefined) supabaseUpdates.is_perishable = updates.isPerishable;

    if (!isOffline) {
      try {
        await supabase.from('medicines').update(supabaseUpdates).eq('id', id);
      } catch (err) {
        console.error('Failed to sync medicine update to Supabase:', err);
      }
    }

    setInventory(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      localStorage.setItem('pharma_inventory', JSON.stringify(updated));
      return updated;
    });
  };

  const addMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    const id = `MED-${Math.floor(10000 + Math.random() * 90000)}`;
    const newMed: Medicine = { ...medicine, id };

    if (!isOffline) {
      try {
        const supabaseMed = {
          id,
          name: newMed.name,
          sku: newMed.sku,
          category: newMed.category,
          batch: newMed.batch,
          expiry_date: newMed.expiryDate,
          price: newMed.price,
          purchase_price: newMed.purchasePrice,
          stock: newMed.stock,
          reorder_point: newMed.reorderPoint,
          storage: newMed.storage,
          is_perishable: newMed.isPerishable
        };
        await supabase.from('medicines').insert(supabaseMed);
      } catch (err) {
        console.error('Failed to sync new medicine to Supabase:', err);
      }
    }

    setInventory(prev => {
      const updated = [...prev, newMed].sort((a,b) => a.name.localeCompare(b.name));
      localStorage.setItem('pharma_inventory', JSON.stringify(updated));
      return updated;
    });
    return newMed;
  };

  const receiveStock = async (id: string, quantity: number) => {
    const med = inventory.find(m => m.id === id);
    if (!med) return;

    const newStock = med.stock + quantity;
    
    if (!isOffline) {
      try {
        await supabase.from('medicines').update({ stock: newStock }).eq('id', id);
      } catch (err) {
        console.error('Failed to sync stock receipt to Supabase:', err);
      }
    }

    setInventory(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, stock: newStock } : m);
        localStorage.setItem('pharma_inventory', JSON.stringify(updated));
        return updated;
    });

    // Add to audit log (simple simulation)
    console.log(`[AUDIT LOG] Received ${quantity} units of ${med.name}. New total: ${newStock}`);
  };

  return (
    <DatabaseContext.Provider value={{ inventory, transactions, users, orders, rxQueue, currentUser, cart, isLoading, isOffline, addToCart, updateCartQuantity, removeFromCart, clearCart, processSale, createOrder, updateOrderStatus, submitPrescription, updateRxStatus, signup, login, logout, resetDatabase, reviewedAlerts, markAlertAsReviewed, markAllAlertsAsReviewed, updateMedicine, addMedicine, receiveStock }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
}
