/** @type {import('next').NextConfig} */
const eventsHome = process.env.NEXT_PUBLIC_EVENTS_HOME === '1';

const nextConfig = {
  // Deployments dedicated to event records open on /events instead of the sales report.
  async redirects() {
    return eventsHome ? [{ source: '/', destination: '/events', permanent: false }] : [];
  },
};

export default nextConfig;
