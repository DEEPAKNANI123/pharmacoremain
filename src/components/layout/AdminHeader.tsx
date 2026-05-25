import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Calendar, Landmark, Package, X } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import { useNavigate } from 'react-router-dom';
import './AdminHeader.css';

export default function AdminHeader({ title = "Dashboard" }: { title?: string }) {
  const { inventory } = useDatabase();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim() || !Array.isArray(inventory)) return [];
    return inventory.filter(m => {
      const name = m?.name?.toLowerCase() || '';
      const sku = m?.sku?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || sku.includes(query);
    }).slice(0, 8);
  }, [searchQuery, inventory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (id: string) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/admin/inventory?search=${id}`);
  };

  return (
    <div className="admin-header">
      <div className="header-title">
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>
      </div>
      
      <div className="header-actions">
        <div className="search-bar" ref={searchRef}>
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search medicines, SKU.." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}

          {showResults && searchQuery.trim() && (
            <div className="search-results-dropdown shadow-lg animate-fade-in">
              {filteredResults.length > 0 ? (
                <>
                  <div className="results-header">Medicines Found ({filteredResults.length})</div>
                  {filteredResults.map(m => (
                    <div 
                      key={m.id} 
                      className="search-result-item"
                      onClick={() => handleResultClick(m.id)}
                    >
                      <div className="result-icon">
                        <Package size={16} />
                      </div>
                      <div className="result-info">
                        <h5>{m.name}</h5>
                        <p>{m.sku} · {m.category}</p>
                      </div>
                      <div className={`result-status ${(m.stock || 0) < 10 ? 'text-danger' : 'text-success'}`}>
                        {m.stock || 0} in stock
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="no-results">
                  <Package size={24} className="text-muted mb-2" />
                  <p>No medicines found for "<strong>{searchQuery}</strong>"</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="header-badge alert-badge clickable-badge" onClick={() => navigate('/admin/alerts')}>
          <div className="dot danger"></div>
          <span>7 Alerts</span>
        </div>
        
        <div className="header-badge">
          <Calendar size={16} className="text-primary" />
          <span>Apr 9, 2026</span>
        </div>
        
        <div className="header-badge">
          <Landmark size={16} className="text-primary" />
          <span>Main Branch</span>
        </div>
        
        <div className="avatar">
          AR
        </div>
      </div>
    </div>
  );
}
