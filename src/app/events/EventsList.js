"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './events.module.css';
import EventForm from './EventForm';
import { eventStatus, eventDays, formatRange, baht, day, todayBkk } from './eventUtils';

export default function EventsList() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [view, setView] = useState('cards');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '読み込みに失敗しました');
        setEvents(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const today = todayBkk();
  const years = useMemo(
    () => [...new Set(events.map((e) => day(e.startDate).slice(0, 4)))].sort().reverse(),
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (status && eventStatus(ev, today).key !== status) return false;
      if (year && day(ev.startDate).slice(0, 4) !== year) return false;
      if (!q) return true;
      const hay = [ev.title, ev.venue, ev.location, ev.notes, ev.promotions, ...(ev.brands || [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [events, query, status, year, today]);

  const stats = useMemo(() => {
    const thisYear = today.slice(0, 4);
    return {
      total: events.length,
      live: events.filter((e) => eventStatus(e, today).key === 'live').length,
      daysThisYear: events
        .filter((e) => day(e.startDate).startsWith(thisYear))
        .reduce((s, e) => s + eventDays(e), 0),
      media: events.reduce((s, e) => s + e.photoCount + e.videoCount, 0),
      thisYear,
    };
  }, [events, today]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          {process.env.NEXT_PUBLIC_EVENTS_HOME !== '1' && (
            <Link href="/" className={styles.back}>← Sales & Stock Report</Link>
          )}
          <h1 className={styles.title}>イベント記録</h1>
        </div>
        <button className={styles.btnPrimary} onClick={() => setCreating(true)}>＋ イベントを追加</button>
      </header>

      <section className={styles.kpis}>
        <Kpi label="イベント数" value={stats.total} />
        <Kpi label="開催中" value={stats.live} accent={stats.live > 0} />
        <Kpi label={`${stats.thisYear}年の出店日数`} value={`${stats.daysThisYear}日`} />
        <Kpi label="写真・動画" value={stats.media} />
      </section>

      <section className={`${styles.toolbar} glass-panel`}>
        <input
          className={styles.search}
          type="search"
          placeholder="イベント名・会場・ブランドで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">すべての状態</option>
          <option value="live">開催中</option>
          <option value="upcoming">開催予定</option>
          <option value="done">終了</option>
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">すべての年</option>
          {years.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
        <div className={styles.segmented} role="group" aria-label="表示切替">
          <button className={view === 'cards' ? styles.segOn : ''} onClick={() => setView('cards')}>カード</button>
          <button className={view === 'table' ? styles.segOn : ''} onClick={() => setView('table')}>一覧表</button>
        </div>
      </section>

      {loading && <div className={styles.muted}>読み込み中…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className={`${styles.empty} glass-panel`}>該当するイベントがありません。</div>
      )}

      {view === 'cards' ? (
        <div className={styles.cardGrid}>
          {filtered.map((ev) => {
            const st = eventStatus(ev, today);
            return (
              <Link key={ev.id} href={`/events/${ev.id}`} className={`${styles.card} glass-panel`}>
                <div className={styles.cover}>
                  {ev.coverUrl ? <img src={ev.coverUrl} alt="" loading="lazy" /> : <div className={styles.noCover}>No photo</div>}
                  <span className={`${styles.badge} ${styles[st.key]}`}>{st.label}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.dates}>{formatRange(ev)}<span>・{eventDays(ev)}日間</span></div>
                  <h2 className={styles.cardTitle}>{ev.title}</h2>
                  <div className={styles.venue}>{ev.venue}</div>
                  <div className={styles.chips}>
                    {(ev.brands || []).slice(0, 4).map((b) => <span key={b} className={styles.chip}>{b}</span>)}
                    {ev.brands?.length > 4 && <span className={styles.chip}>+{ev.brands.length - 4}</span>}
                  </div>
                  <div className={styles.cardFoot}>
                    <span>📷 {ev.photoCount}</span>
                    <span>🎬 {ev.videoCount}</span>
                    {ev.sales && <span className={styles.salesTag}>売上 {baht(ev.sales.amount)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        filtered.length > 0 && (
          <section className="glass-panel" style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>会期</th><th>イベント</th><th>会場</th><th>状態</th><th>日数</th><th>ブランド</th><th>写真/動画</th><th>売上</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => {
                  const st = eventStatus(ev, today);
                  return (
                    <tr key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}>
                      <td className={styles.nowrap}>{formatRange(ev)}</td>
                      <td><Link href={`/events/${ev.id}`}>{ev.title}</Link></td>
                      <td>{ev.venue}</td>
                      <td><span className={`${styles.badgeInline} ${styles[st.key]}`}>{st.label}</span></td>
                      <td className={styles.num}>{eventDays(ev)}</td>
                      <td>{(ev.brands || []).join(', ')}</td>
                      <td className={styles.num}>{ev.photoCount} / {ev.videoCount}</td>
                      <td className={styles.num}>{ev.sales ? baht(ev.sales.amount) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )
      )}

      {creating && (
        <EventForm
          onClose={() => setCreating(false)}
          onSaved={(ev) => router.push(`/events/${ev.id}`)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div className={`${styles.kpi} glass-panel`}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={`${styles.kpiValue} ${accent ? styles.kpiAccent : ''}`}>{value}</div>
    </div>
  );
}
