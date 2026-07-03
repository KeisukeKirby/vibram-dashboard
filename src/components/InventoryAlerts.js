import styles from './InventoryAlerts.module.css';

export default function InventoryAlerts({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Inventory & Forecast Alerts</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Color</th>
              <th>Size</th>
              <th>Current Stock</th>
              <th>Avg Daily Sales (30d)</th>
              <th>Days of Supply</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.color}</td>
                <td>{item.size}</td>
                <td>{item.currentStock}</td>
                <td>{item.avgDailySales}</td>
                <td>{item.daysOfSupply}</td>
                <td>
                  <span className={`${styles.badge} ${styles[item.status.toLowerCase()]}`}>
                    {item.status}
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
