import EventDetail from './EventDetail';

export const metadata = {
  title: 'イベント詳細 | BFT',
};

export default async function EventPage({ params }) {
  const { id } = await params;
  return (
    <main className="events-main">
      <EventDetail id={id} />
    </main>
  );
}
