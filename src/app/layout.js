import './globals.css';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'BFT Sales & Stock Report',
  description: 'Sales & Inventory Dashboard',
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
