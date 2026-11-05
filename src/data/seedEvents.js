// Initial event records. Inserted automatically when the Event table is empty.
const base = '/events/2026-10-terminal21-rama3';

const photo = (n, caption) => ({
  type: 'image',
  url: `${base}/photo-${String(n).padStart(2, '0')}.jpg`,
  caption,
});
const video = (n, caption) => ({
  type: 'video',
  url: `${base}/video-${n}.mp4`,
  posterUrl: `${base}/video-${n}-poster.jpg`,
  caption,
});

const seedEvents = [
  {
    slug: '2026-10-terminal21-rama3',
    title: 'Terminal 21 Rama 3 ポップアップ',
    venue: 'Terminal 21 Rama 3',
    location: 'Gフロア 中央アトリウム（藤の木の下・G053前／Quiksilver・Roxy・Volcom向かい）',
    startDate: '2026-10-17',
    endDate: '2026-11-01',
    brands: ['Vibram FiveFingers', 'Vivobarefoot', 'tabiRela', 'hitoe+', 'OLENO', 'Vibram Socks'],
    promotions: [
      'Vibram FiveFingers：最大40% OFF',
      'Vivobarefoot：10–20% OFF',
      'tabiRela：40% OFF（3,990 → 2,388 THB）',
      'hitoe+：40% OFF',
      'OLENO ソックス（Made in Japan）：10% OFF',
    ].join('\n'),
    notes: [
      '・木製トレッスルテーブル2列に FiveFingers / Vivobarefoot を面展開、背面に在庫箱を黄色ラックで積み上げ。',
      '・ソックス什器（OLENO・5本指ソックス）を藤の木の幹まわりに配置。',
      '・入口に「Vibram FiveFingers MOVE FREE」ボード、Vivobarefoot のフェザーフラッグ、割引イーゼル。',
      '・周辺：Sportsworld Outlet（adidas / Nike / Under Armour）が近く、競合の割引訴求あり。',
      '・会期終盤 10/30–11/1 は館内「Spooky Halloween」イベント（Gate 4付近）で家族連れの集客が多い。',
    ].join('\n'),
    media: [
      photo(1, 'ブース全景（通路側から）'),
      photo(2, '近隣の Sportsworld Outlet（adidas / Nike）'),
      photo(3, 'テーブル展示と Vivobarefoot フラッグ'),
      photo(4, 'FiveFingers 展示（上から）'),
      photo(5, 'アーチ越しのブース全景と割引イーゼル'),
      photo(6, '館内マーケットエリア（ユニオンジャック装飾）'),
      photo(7, 'ソックス什器と Vivobarefoot 在庫'),
      photo(8, '藤の木まわりの在庫・ソックス展示'),
      photo(9, '館内 Spooky Halloween イベント（Gate 4）'),
      photo(10, 'Halloween イベントの人だかり'),
      photo(11, 'tabiRela / hitoe+ プロモーションボード'),
      video(3020, '館内の様子・人通り 1'),
      video(3021, '館内の様子・人通り 2'),
      video(3022, '館内の様子・人通り 3'),
      video(3023, '館内の様子・人通り 4'),
      video(3024, '館内の様子・人通り 5'),
    ],
  },
];

export default seedEvents;
