"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import styles from '../events.module.css';
import EventForm from '../EventForm';
import { eventStatus, eventDays, formatRange, baht } from '../eventUtils';

export default function EventDetail({ id }) {
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('all');
  const [lightbox, setLightbox] = useState(null); // index into visible media
  const [uploading, setUploading] = useState(null); // { done, total, name }
  const [uploadError, setUploadError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '読み込みに失敗しました');
      setEvent(json);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const media = event?.media || [];
  const visible = tab === 'all' ? media : media.filter((m) => m.type === tab);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i + 1) % visible.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i - 1 + visible.length) % visible.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, visible.length]);

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (!files.length) return;
    setUploadError('');
    const items = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploading({ done: i, total: files.length, name: f.name });
        const blob = await upload(`events/${id}/${f.name}`, f, {
          access: 'public',
          handleUploadUrl: '/api/events/upload',
          multipart: f.size > 20 * 1024 * 1024,
          contentType: f.type,
        });
        items.push({ type: f.type.startsWith('video/') ? 'video' : 'image', url: blob.url });
      }
    } catch (e) {
      setUploadError(e.message || 'アップロードに失敗しました');
    }
    if (items.length) {
      await fetch(`/api/events/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      await load();
    }
    setUploading(null);
  };

  const editCaption = async (m) => {
    const caption = prompt('キャプション', m.caption || '');
    if (caption === null) return;
    await fetch(`/api/events/${id}/media/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    });
    load();
  };

  const removeMedia = async (m) => {
    if (!confirm('このファイルを削除しますか？')) return;
    await fetch(`/api/events/${id}/media/${m.id}`, { method: 'DELETE' });
    setLightbox(null);
    load();
  };

  const removeEvent = async () => {
    if (!confirm(`「${event.title}」を削除しますか？写真・動画の記録も削除されます。`)) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/events');
  };

  if (error) {
    return (
      <div className={styles.page}>
        <Link href="/events" className={styles.back}>← イベント一覧</Link>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }
  if (!event) return <div className={`${styles.page} ${styles.muted}`}>読み込み中…</div>;

  const st = eventStatus(event);
  const photos = media.filter((m) => m.type === 'image').length;
  const videos = media.length - photos;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/events" className={styles.back}>← イベント一覧</Link>
          <h1 className={styles.title}>{event.title}</h1>
          <div className={styles.subhead}>
            <span className={`${styles.badgeInline} ${styles[st.key]}`}>{st.label}</span>
            <span>{formatRange(event)}（{eventDays(event)}日間）</span>
            <span>・{event.venue}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={() => setEditing(true)}>編集</button>
          <button className={styles.btnDanger} onClick={removeEvent}>削除</button>
        </div>
      </header>

      <div className={styles.detailGrid}>
        <section className={`${styles.panel} glass-panel`}>
          <h2 className={styles.panelTitle}>概要</h2>
          <dl className={styles.facts}>
            <dt>会場</dt><dd>{event.venue}</dd>
            {event.location && (<><dt>場所</dt><dd>{event.location}</dd></>)}
            <dt>会期</dt><dd>{formatRange(event)}（{eventDays(event)}日間）</dd>
            <dt>ブランド</dt>
            <dd className={styles.chips}>
              {event.brands.length ? event.brands.map((b) => <span key={b} className={styles.chip}>{b}</span>) : '—'}
            </dd>
            <dt>記録</dt><dd>写真 {photos}枚・動画 {videos}本</dd>
          </dl>
        </section>

        <section className={`${styles.panel} glass-panel`}>
          <h2 className={styles.panelTitle}>プロモーション</h2>
          {event.promotions ? (
            <ul className={styles.promoList}>
              {event.promotions.split('\n').filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          ) : <p className={styles.muted}>未入力</p>}
        </section>

        <section className={`${styles.panel} ${styles.span2} glass-panel`}>
          <h2 className={styles.panelTitle}>メモ・所感</h2>
          {event.notes ? <p className={styles.notes}>{event.notes}</p> : <p className={styles.muted}>未入力</p>}
        </section>

        <section className={`${styles.panel} ${styles.span2} glass-panel`}>
          <h2 className={styles.panelTitle}>会期中の売上</h2>
          {event.sales ? (
            <SalesBlock sales={event.sales} storeKey={event.storeKey} />
          ) : (
            <p className={styles.muted}>
              売上データの店舗が未設定です。「編集」から店舗を選ぶと、会期中の売上を表示します。
            </p>
          )}
        </section>
      </div>

      <section className={`${styles.panel} glass-panel`}>
        <div className={styles.galleryHead}>
          <h2 className={styles.panelTitle}>写真・動画</h2>
          <div className={styles.segmented} role="group" aria-label="種類">
            <button className={tab === 'all' ? styles.segOn : ''} onClick={() => setTab('all')}>すべて {media.length}</button>
            <button className={tab === 'image' ? styles.segOn : ''} onClick={() => setTab('image')}>写真 {photos}</button>
            <button className={tab === 'video' ? styles.segOn : ''} onClick={() => setTab('video')}>動画 {videos}</button>
          </div>
          <label className={styles.btnPrimary}>
            ＋ 追加
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              disabled={!!uploading}
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            />
          </label>
        </div>

        {uploading && (
          <div className={styles.progress}>
            アップロード中 {uploading.done + 1}/{uploading.total}：{uploading.name}
          </div>
        )}
        {uploadError && <div className={styles.error}>{uploadError}</div>}

        {visible.length === 0 ? (
          <p className={styles.muted}>まだファイルがありません。</p>
        ) : (
          <div className={styles.gallery}>
            {visible.map((m, i) => (
              <figure key={m.id} className={styles.thumb}>
                <button className={styles.thumbBtn} onClick={() => setLightbox(i)} aria-label={m.caption || '開く'}>
                  {m.type === 'image' ? (
                    <img src={m.url} alt={m.caption || ''} loading="lazy" />
                  ) : m.posterUrl ? (
                    <img src={m.posterUrl} alt={m.caption || ''} loading="lazy" />
                  ) : (
                    <video src={`${m.url}#t=0.5`} preload="metadata" muted playsInline />
                  )}
                  {m.type === 'video' && <span className={styles.play}>▶</span>}
                </button>
                {m.caption && <figcaption>{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>

      {lightbox !== null && visible[lightbox] && (
        <Lightbox
          item={visible[lightbox]}
          index={lightbox}
          total={visible.length}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i - 1 + visible.length) % visible.length)}
          onNext={() => setLightbox((i) => (i + 1) % visible.length)}
          onCaption={() => editCaption(visible[lightbox])}
          onDelete={() => removeMedia(visible[lightbox])}
        />
      )}

      {editing && (
        <EventForm
          initial={event}
          stores={event.stores}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}
    </div>
  );
}

function SalesBlock({ sales, storeKey }) {
  if (!sales.rows) {
    return <p className={styles.muted}>店舗「{storeKey}」の会期中の売上データはまだありません。</p>;
  }
  const max = Math.max(...sales.daily.map((d) => d.amount), 1);
  return (
    <div className={styles.sales}>
      <div className={styles.salesKpis}>
        <div><span>売上合計</span><strong>{baht(sales.amount)}</strong></div>
        <div><span>販売数</span><strong>{sales.quantity.toLocaleString()}足/点</strong></div>
        <div><span>店舗</span><strong>{storeKey}</strong></div>
      </div>
      {sales.daily.length > 0 && (
        <div className={styles.bars} aria-label="日別売上">
          {sales.daily.map((d) => (
            <div key={d.date} className={styles.barCol} title={`${d.date}: ${baht(d.amount)}`}>
              <div className={styles.bar} style={{ height: `${(d.amount / max) * 100}%` }} />
              <span>{Number(d.date.slice(8))}</span>
            </div>
          ))}
        </div>
      )}
      {sales.topProducts.length > 0 && (
        <table className={styles.table}>
          <thead><tr><th>商品</th><th className={styles.num}>数量</th><th className={styles.num}>売上</th></tr></thead>
          <tbody>
            {sales.topProducts.map((p) => (
              <tr key={p.product}>
                <td>{p.product}</td>
                <td className={styles.num}>{p.quantity}</td>
                <td className={styles.num}>{baht(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Lightbox({ item, index, total, onClose, onPrev, onNext, onCaption, onDelete }) {
  return (
    <div className={styles.lbOverlay} onClick={onClose}>
      <div className={styles.lbInner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lbMedia}>
          {item.type === 'image' ? (
            <img src={item.url} alt={item.caption || ''} />
          ) : (
            <video key={item.url} src={item.url} poster={item.posterUrl || undefined} controls autoPlay playsInline />
          )}
        </div>
        <div className={styles.lbBar}>
          <span className={styles.lbCaption}>{index + 1} / {total}　{item.caption || ''}</span>
          <div className={styles.actions}>
            <a className={styles.btnGhost} href={item.url} target="_blank" rel="noreferrer">原寸</a>
            <button className={styles.btnGhost} onClick={onCaption}>キャプション</button>
            <button className={styles.btnDanger} onClick={onDelete}>削除</button>
          </div>
        </div>
        <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={onPrev} aria-label="前へ">‹</button>
        <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={onNext} aria-label="次へ">›</button>
        <button className={styles.lbClose} onClick={onClose} aria-label="閉じる">×</button>
      </div>
    </div>
  );
}
