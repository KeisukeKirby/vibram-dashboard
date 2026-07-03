"use client";

import { useState } from 'react';
import styles from './UploadModal.module.css';

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    if (storeName) formData.append('storeName', storeName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass-panel`}>
        <div className={styles.header}>
          <h2>Upload Sales Data</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.dropzone}>
            <input 
              type="file" 
              accept=".csv, .xlsx"
              onChange={(e) => setFile(e.target.files[0])} 
              className={styles.fileInput} 
            />
            <p>{file ? file.name : 'Drag & drop a CSV or Excel file here, or click to select'}</p>
          </div>

          <div className={styles.meta}>
            <label>Store Name (required for manual sheets)</label>
            <input 
              type="text" 
              placeholder="e.g. Siam Discovery" 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
            />
          </div>

          {loading && <p className={styles.loading}>Processing...</p>}
          
          {result && (
            <div className={result.success ? styles.success : styles.error}>
              {result.success 
                ? `Success! Inserted: ${result.inserted}, Failed: ${result.failed}`
                : `Error: ${result.error}`}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
