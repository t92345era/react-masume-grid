import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル型: 日付（date）', en: 'Cell type: date' },
  description: {
    ja:
      'カレンダー入力になり、data には YYYY-MM-DD で保存されます。貼り付けたテキストは'
      + '2026/1/5、2026年1月5日、20260105 のような表記でも正規化されます。'
      + '表示だけ和暦や別書式にしたい場合は format を併用します（表示フォーマットのサンプルを参照）。',
    en:
      'A calendar input, stored in data as YYYY-MM-DD. Pasted text is normalized from the formats '
      + 'people actually paste, including 2026/1/5, 2026年1月5日 and 20260105. To show a different '
      + 'format without changing the stored value, combine it with format (see the formatting sample).',
  },
  order: 4,
  docs: { ja: 'セル型', en: 'Cell types' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['区分', '日付'],
    rows: [['入荷', '2026-01-05'], ['出荷', '2026-02-14'], ['棚卸', '']],
    format: (y: string, m: string, d: string) => `${y}年${Number(m)}月${Number(d)}日`,
  },
  en: {
    columns: ['Event', 'Date'],
    rows: [['Received', '2026-01-05'], ['Shipped', '2026-02-14'], ['Stocktake', '']],
    format: (y: string, m: string, d: string) =>
      new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
  },
};

export default function CellDate() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 130 },
          {
            title: t.columns[1],
            width: 160,
            type: 'date',
            // Display only — the stored value stays YYYY-MM-DD
            format: (v) => {
              const [y, m, d] = v.split('-');
              return t.format(y, m, d);
            },
          },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">data: {JSON.stringify(data)}</p>
    </>
  );
}
