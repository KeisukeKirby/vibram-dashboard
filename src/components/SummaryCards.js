import styles from './SummaryCards.module.css';

export default function SummaryCards({ data }) {
  if (!data) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.title}>Total Sales</div>
        <div className={styles.value}>{formatCurrency(data.totalSales)}</div>
      </div>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.title}>Total Quantity</div>
        <div className={styles.value}>{formatNumber(data.totalQuantity)}</div>
      </div>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.title}>Total Discount</div>
        <div className={styles.value}>{formatCurrency(data.totalDiscount)}</div>
      </div>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.title}>Transactions</div>
        <div className={styles.value}>{formatNumber(data.transactions)}</div>
      </div>
    </div>
  );
}
