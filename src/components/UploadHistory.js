"use client";
import { useState, useEffect } from 'react';
import styles from './UploadHistory.module.css';

export default function UploadHistory({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/history')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Upload History</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Source Type</th>
                <th>Rows</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.fileName}</td>
                  <td>{log.sourceType}</td>
                  <td>{log.totalRows}</td>
                  <td className={styles[log.status.toLowerCase()]}>{log.status}</td>
                  <td>{new Date(log.importedAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center'}}>No uploads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
