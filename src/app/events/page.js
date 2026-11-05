import EventsList from './EventsList';

export const metadata = {
  title: 'イベント記録 | BFT',
  description: 'ポップアップ・催事イベントの記録一覧',
};

export default function EventsPage() {
  return (
    <main className="events-main">
      <EventsList />
    </main>
  );
}
