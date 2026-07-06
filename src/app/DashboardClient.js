"use client";

import { useState, useEffect } from 'react';
import styles from './DashboardClient.module.css';
import UploadModal from '@/components/UploadModal';
import SummaryCards from '@/components/SummaryCards';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import CompositionCharts from '@/components/CompositionCharts';
import InventoryAlerts from '@/components/InventoryAlerts';

export default function DashboardClient() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [compositionData, setCompositionData] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [store, setStore] = useState('');
  const [channel, setChannel] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (store) params.append('store', store);
      if (channel) params.append('channel', channel);

      const [summaryRes, tsRes, compRes, invRes] = await Promise.all([
        fetch(`/api/dashboard/summary?${params.toString()}`),
        fetch(`/api/dashboard/timeseries?${params.toString()}`),
        fetch(`/api/dashboard/composition?${params.toString()}`),
        fetch(`/api/dashboard/inventory?${params.toString()}`)
      ]);

      if (summaryRes.ok) setSummaryData(await summaryRes.json());
      if (tsRes.ok) setTimeseriesData(await tsRes.json());
      if (compRes.ok) setCompositionData(await compRes.json());
      if (invRes.ok) setInventoryData(await invRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [store, channel]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>BFT Sales & Stock Report</h1>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setIsUploadOpen(true)}>
            Upload Data
          </button>
        </div>
      </header>

      <section className={`${styles.filters} glass-panel`}>
        <select value={store} onChange={(e) => setStore(e.target.value)}>
          <option value="">All Stores</option>
          <option value="Siam Discovery">Siam Discovery</option>
          <option value="Central">Central</option>
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">All Channels</option>
          <option value="Retail">Retail</option>
          <option value="POS">POS</option>
          <option value="EC">EC</option>
          <option value="Shopee">Shopee</option>
        </select>
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
    </div>
  );
}
