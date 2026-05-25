import { UserPlus } from 'lucide-react';
import './Customers.css';

export default function Customers() {
  const customers = [
    { 
      id: 1, 
      name: 'Ahmed Al Rashid', 
      meta: 'Family: 4 members · Gold', 
      phone: '+971 50 123 4567', 
      points: '2,840 pts', 
      orders: 38, 
      lastOrder: 'Today' 
    },
    { 
      id: 2, 
      name: 'Sara Hassan', 
      meta: 'Birthday: Apr 15 — in 5 days', 
      metaClass: 'birthday-alert',
      phone: '+971 55 987 6543', 
      points: '1,220 pts', 
      orders: 14, 
      lastOrder: 'Apr 7' 
    },
    { 
      id: 3, 
      name: 'Fatima Al Zaabi', 
      meta: '', 
      phone: '+971 52 444 5566', 
      points: '540 pts', 
      orders: 7, 
      lastOrder: 'Apr 5' 
    }
  ];

  const handleAddCustomer = () => {
    alert("Add Customer workflow initiated...");
  };

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Customers</h1>
        <button className="btn btn-primary flex-center gap-2" onClick={handleAddCustomer}>
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="customers-panel overflow-hidden">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th className="text-center">Loyalty Pts</th>
              <th className="text-center">Orders</th>
              <th>Last Order</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-bold">{c.name}</div>
                  {c.meta && <span className={`meta-text ${c.metaClass || ''}`}>{c.meta}</span>}
                </td>
                <td className="text-muted">{c.phone}</td>
                <td className="text-center loyalty-pts">{c.points}</td>
                <td className="text-center font-bold">{c.orders}</td>
                <td>{c.lastOrder}</td>
                <td className="text-right">
                  <button className="btn btn-outline btn-sm px-4 py-1 text-xs">
                    Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
