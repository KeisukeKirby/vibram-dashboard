"use client";

import { useState, useEffect } from 'react';
import styles from './DashboardClient.module.css';
import UploadModal from '@/components/UploadModal';
import UploadHistory from '@/components/UploadHistory';
import SummaryCards from '@/components/SummaryCards';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import CompositionCharts from '@/components/CompositionCharts';
import InventoryAlerts from '@/components/InventoryAlerts';

export default function DashboardClient() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [compositionData, setCompositionData] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [store, setStore] = useState('');
  const [channel, setChannel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (store) params.append('store', store);
      if (channel) params.append('channel', channel);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [summaryRes, tsRes, compRes, invRes, prodRes] = await Promise.all([
        fetch(`/api/dashboard/summary?${params.toString()}`),
        fetch(`/api/dashboard/timeseries?${params.toString()}`),
        fetch(`/api/dashboard/composition?${params.toString()}`),
        fetch(`/api/dashboard/inventory?${params.toString()}`),
        fetch(`/api/dashboard/products?${params.toString()}`)
      ]);

      if (summaryRes.ok) setSummaryData(await summaryRes.json());
      if (tsRes.ok) setTimeseriesData(await tsRes.json());
      if (compRes.ok) setCompositionData(await compRes.json());
      if (invRes.ok) setInventoryData(await invRes.json());
      if (prodRes.ok) setProductsData(await prodRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [store, channel, startDate, endDate]);

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        alert("Data reset successfully.");
        fetchData();
      } else {
        alert("Failed to reset data.");
      }
    }
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>BFT Sales & Stock Report</h1>
        <div className={styles.actions} style={{ display: 'flex', gap: '10px' }}>
          <button className={styles.btnSecondary} onClick={() => setIsHistoryOpen(true)}>
            History
          </button>
          <button className={styles.btnPrimary} onClick={() => setIsUploadOpen(true)}>
            Upload Data
          </button>
          <button className={styles.btnDanger} style={{ background: '#f87171', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} onClick={handleReset}>
            Reset Data
          </button>
        </div>
      </header>

      <section className={`${styles.filters} glass-panel`}>
        <select value={store} onChange={(e) => setStore(e.target.value)}>
          <option value="">All Stores</option>
          <option value="Siam Discovery">Siam Discovery</option>
          <option value="Central World">Central World</option>
          <option value="Chid Lom">Chid Lom</option>
          <option value="Lat Phrao">Lat Phrao</option>
          <option value="Barefoot Park">Barefoot Park</option>
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">All Channels</option>
          <option value="Shopee">Shopee</option>
          <option value="Lazada">Lazada</option>
          <option value="POS">POS</option>
        </select>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Compare Period:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span>to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className={styles.btnPrimary} onClick={fetchData}>Refresh</button>
      </section>

      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          <SummaryCards data={summaryData} />
          
          <div className={styles.grid}>
            <TimeSeriesChart data={timeseriesData} />
          </div>

          <CompositionCharts data={compositionData} />
          <InventoryAlerts data={inventoryData} />

          {/* Simple Product Drilldown Table */}
          <section className="glass-panel" style={{ marginTop: '20px', padding: '20px' }}>
            <h2>Product Performance</h2>
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '8px' }}>Product</th>
                    <th style={{ padding: '8px' }}>Qty</th>
                    <th style={{ padding: '8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.slice(0, 50).map(p => (
                    <tr key={p.name} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '8px' }}>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '0.85em', color: '#888', marginLeft: '10px' }}>
                          {p.colors.map(c => (
                            <div key={c.name}>
                              {c.name}: {c.sizes.map(s => `${s.name}(${s.quantity})`).join(', ')}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>{p.quantity}</td>
                      <td style={{ padding: '8px' }}>฿{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={() => {
            setIsUploadOpen(false);
            fetchData();
          }} 
        />
      )}

      {isHistoryOpen && (
        <UploadHistory onClose={() => setIsHistoryOpen(false)} />
      )}
    </div>
  );
}
