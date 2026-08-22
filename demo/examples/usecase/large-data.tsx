import { useMemo, useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '大量データ（10万行）', en: 'Large data (100k rows)' },
  description: {
    ja:
      '行は仮想化して描画しているので、行数を増やしてもスクロールは重くなりません。'
      + '10万行に切り替えてから、スクロールバーを一番下まで引いてみてください。'
      + 'なお列の仮想化は行っていないため、数百列を超える場合は別途注意が必要です。',
    en:
      'Rows are virtualized, so scrolling stays smooth however many there are. Switch to 100,000 rows '
      + 'and drag the scrollbar all the way down. Columns are not virtualized, though — mind '
      + 'performance beyond a few hundred of them.',
  },
  order: 40,
  docs: { ja: '制限事項（現バージョン）', en: 'Limitations (current version)' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['ID', '品目', '単価', '数量'],
    item: (i: number) => `品目 ${i}`,
    rows: (n: string) => `${n} 行`,
    current: (n: string) => `現在 ${n} 行`,
  },
  en: {
    columns: ['ID', 'Item', 'Unit price', 'Qty'],
    item: (i: number) => `Item ${i}`,
    rows: (n: string) => `${n} rows`,
    current: (n: string) => `${n} rows loaded`,
  },
};

const SIZES = [1_000, 10_000, 100_000];

export default function LargeData() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const makeRows = (count: number): string[][] =>
    Array.from({ length: count }, (_, i) => [
      `ID-${String(i + 1).padStart(6, '0')}`,
      t.item(i + 1),
      String(((i * 37) % 900) + 100),
      String((i % 28) + 1),
    ]);

  const [size, setSize] = useState(10_000);
  const [data, setData] = useState<string[][]>(() => makeRows(10_000));

  const columns = useMemo(
    () => [
      { title: t.columns[0], width: 120, readOnly: true },
      { title: t.columns[1], width: 200 },
      { title: t.columns[2], width: 120, type: 'number' as const, format: formatThousands },
      { title: t.columns[3], width: 90, type: 'number' as const },
    ],
    [t],
  );

  return (
    <>
      <div className="ex-toolbar">
        {SIZES.map((n) => (
          <button
            key={n}
            type="button"
            className={'ex-btn' + (n === size ? ' ex-btn--on' : '')}
            onClick={() => {
              setSize(n);
              setData(makeRows(n));
            }}
          >
            {t.rows(n.toLocaleString())}
          </button>
        ))}
        <span className="ex-note">{t.current(data.length.toLocaleString())}</span>
      </div>
      <MasumeGrid data={data} onChange={setData} columns={columns} style={{ height: 360 }} />
    </>
  );
}
