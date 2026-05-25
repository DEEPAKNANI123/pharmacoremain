import { Download, ChevronRight, FilePieChart, ClipboardList, ShoppingBag, Percent, Users, ThermometerSnowflake } from 'lucide-react';
import './ReportsPage.css';

export default function ReportsPage() {
  const reports = [
    {
      title: 'Sales Report',
      desc: 'Revenue, transactions, top medicines, margins',
      icon: <FilePieChart size={20} className="text-primary" />
    },
    {
      title: 'Inventory Aging',
      desc: 'Expiry risk, dead stock, FEFO status',
      icon: <ClipboardList size={20} className="text-success" />
    },
    {
      title: 'Purchase Report',
      desc: 'Supplier spend, PO on-time performance',
      icon: <ShoppingBag size={20} className="text-warning" />
    },
    {
      title: 'VAT Report',
      desc: 'Input/output VAT, filing history, audit trail',
      icon: <Percent size={20} className="text-danger" />
    },
    {
      title: 'HR Payroll Summary',
      desc: 'Salary, shifts, leave balances',
      icon: <Users size={20} style={{ color: '#8b5cf6' }} />
    },
    {
      title: 'Cold Store Incidents',
      desc: 'Temperature breaches, audit log, compliance',
      icon: <ThermometerSnowflake size={20} style={{ color: '#0ea5e9' }} />
    }
  ];

  const handleExportAll = () => {
    alert("Exporting all business reports as a consolidated zip archive...");
  };

  const handleOpenReport = (title: string) => {
    alert(`Generating detailed ${title}...`);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports</h1>
        <button className="btn btn-outline flex-center gap-2" onClick={handleExportAll}>
          <Download size={18} /> Export All
        </button>
      </div>

      <div className="reports-grid">
        {reports.map((r, i) => (
          <div key={i} className="report-card" onClick={() => handleOpenReport(r.title)}>
            <div className="flex-center mb-4" style={{ background: 'var(--color-bg-base)', width: '40px', height: '40px', borderRadius: '8px' }}>
              {r.icon}
            </div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="open-report-link">
              Open report <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
