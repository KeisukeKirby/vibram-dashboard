"use client";

import { useState } from 'react';
import styles from './events.module.css';
import { day } from './eventUtils';

export default function EventForm({ initial, stores = [], onClose, onSaved }) {
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState({
    title: initial?.title || '',
    venue: initial?.venue || '',
    location: initial?.location || '',
    startDate: day(initial?.startDate),
    endDate: day(initial?.endDate),
    brands: (initial?.brands || []).join(', '),
    promotions: initial?.promotions || '',
    notes: initial?.notes || '',
    storeKey: initial?.storeKey || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editing ? `/api/events/${initial.id}` : '/api/events', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '保存に失敗しました');
      onSaved(json);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={`${styles.modal} glass-panel`} onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{editing ? 'イベントを編集' : 'イベントを追加'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="閉じる">×</button>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.full}>
            イベント名 *
            <input value={form.title} onChange={set('title')} required placeholder="例：Terminal 21 Rama 3 ポップアップ" />
          </label>
          <label>
            会場 *
            <input value={form.venue} onChange={set('venue')} required placeholder="例：Terminal 21 Rama 3" />
          </label>
          <label>
            場所の詳細
            <input value={form.location} onChange={set('location')} placeholder="フロア・区画など" />
          </label>
          <label>
            開始日 *
            <input type="date" value={form.startDate} onChange={set('startDate')} required />
          </label>
          <label>
            終了日 *
            <input type="date" value={form.endDate} onChange={set('endDate')} required min={form.startDate} />
          </label>
          <label className={styles.full}>
            ブランド（カンマ区切り）
            <input value={form.brands} onChange={set('brands')} placeholder="Vibram FiveFingers, Vivobarefoot" />
          </label>
          <label className={styles.full}>
            プロモーション
            <textarea rows={3} value={form.promotions} onChange={set('promotions')} placeholder="1行に1つ" />
          </label>
          <label className={styles.full}>
            メモ・所感
            <textarea rows={5} value={form.notes} onChange={set('notes')} placeholder="ブース配置、客層、競合、改善点など" />
          </label>
          <label className={styles.full}>
            売上データの店舗（任意）
            <select value={form.storeKey} onChange={set('storeKey')}>
              <option value="">紐付けない</option>
              {form.storeKey && !stores.includes(form.storeKey) && <option value={form.storeKey}>{form.storeKey}</option>}
              {stores.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <small className={styles.hint}>選ぶと会期中のこの店舗の売上を集計して表示します。</small>
          </label>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>キャンセル</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
