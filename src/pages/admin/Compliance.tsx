import { Plus } from 'lucide-react';
import './Compliance.css';

export default function Compliance() {
  const obligations = [
    { id: 1, name: 'VAT Return Q1 2026', authority: 'FTA UAE', dueDate: 'Apr 16, 2026', daysLeft: '7 days', status: 'Urgent', action: 'Prepare' },
    { id: 2, name: 'MOHAP Narcotics Return', authority: 'MOHAP', dueDate: 'Apr 30, 2026', daysLeft: '21 days', status: 'Upcoming', action: 'Start' },
    { id: 3, name: 'Trade License Renewal', authority: 'DED', dueDate: 'May 1, 2026', daysLeft: '22 days', status: 'Upcoming', action: 'Apply' },
    { id: 4, name: 'DHA Pharmacy Permit', authority: 'DHA', dueDate: 'Jun 15, 2026', daysLeft: '67 days', status: 'On Track', action: 'View' },
    { id: 5, name: 'Pharmacist License', authority: 'DHA', dueDate: 'Jul 1, 2026', daysLeft: '83 days', status: 'On Track', action: 'View' },
  ];

  return (
    <div className="compliance-container">
      <div className="compliance-header">
        <h1>Compliance Calendar</h1>
        <button className="btn btn-primary flex-center gap-2">
          <Plus size={18} /> Add Deadline
        </button>
      </div>

      <div className="compliance-panel overflow-hidden">
        <table className="compliance-table">
          <thead>
            <tr>
              <th>Obligation</th>
              <th>Authority</th>
              <th>Due Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((o) => (
              <tr key={o.id}>
                <td className="font-bold">{o.name}</td>
                <td className="text-muted">{o.authority}</td>
                <td>{o.dueDate}</td>
                <td className={o.status === 'Urgent' ? 'text-danger font-bold' : ''}>{o.daysLeft}</td>
                <td>
                  <span className={`status-${o.status.toLowerCase().replace(' ', '')}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <button className={`btn btn-sm ${o.status === 'Urgent' ? 'btn-primary' : 'btn-outline'} px-4 py-1 text-xs`}>
                    {o.action}
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
