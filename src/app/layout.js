import './globals.css';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'VIBRAM/VFF Analytics',
  description: 'Sales & Inventory Dashboard for VIBRAM/VFF',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
