import { UserPlus } from 'lucide-react';
import './HrPayroll.css';

export default function HrPayroll() {
  const staff = [
    { id: 1, name: 'Dr. Aisha Al Mansoori', role: 'Head Pharmacist', shift: 'Morning', licence: 'DHA - Exp Dec 2026', status: 'Active' },
    { id: 2, name: 'Mohammed Al Rashid', role: 'Cashier', shift: 'Morning', licence: '—', status: 'Active' },
    { id: 3, name: 'Sara Hassan', role: 'Inventory Manager', shift: 'Morning', licence: '—', status: 'Active' },
    { id: 4, name: 'Khalid Nasser', role: 'Pharmacist', shift: 'Evening', licence: 'DHA - Exp Mar 2027', status: 'On Leave' },
    { id: 5, name: 'Fatima Al Zaabi', role: 'Pharmacist', shift: 'Evening', licence: 'DHA - Exp May 2027', status: 'Active' }
  ];

  const handleAddEmployee = () => {
    alert("Add Employee modal opening...");
  };

  return (
    <div className="hr-container">
      <div className="hr-header">
        <h1>HR & Payroll</h1>
        <button className="btn btn-primary flex-center gap-2" onClick={handleAddEmployee}>
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      <div className="hr-metrics">
        <div className="hr-panel">
          <p className="text-muted text-xs font-bold mb-2">Total Staff</p>
          <h2 className="text-2xl font-bold">24</h2>
        </div>
        <div className="hr-panel">
          <p className="text-muted text-xs font-bold mb-2">On Shift Now</p>
          <h2 className="text-2xl font-bold">8</h2>
        </div>
        <div className="hr-panel">
          <p className="text-muted text-xs font-bold mb-2">Payroll (Apr)</p>
          <h2 className="text-2xl font-bold">AED 88,400</h2>
        </div>
        <div className="hr-panel">
          <p className="text-muted text-xs font-bold mb-2">Leave Requests</p>
          <h2 className="text-2xl font-bold" style={{ color: '#ea580c' }}>3</h2>
        </div>
      </div>

      <div className="hr-panel overflow-hidden">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Licence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td className="font-bold">{s.name}</td>
                <td>{s.role}</td>
                <td>{s.shift}</td>
                <td className="text-muted">{s.licence}</td>
                <td>
                  <span className={`status-${s.status.toLowerCase().replace(' ', '')}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
