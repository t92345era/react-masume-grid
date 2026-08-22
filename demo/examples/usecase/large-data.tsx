import { useMemo, useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '大量データ（10万行）',
  description:
    '行は仮想化して描画しているので、行数を増やしてもスクロールは重くなりません。'
    + '10万行に切り替えてから、スクロールバーを一番下まで引いてみてください。'
    + 'なお列の仮想化は行っていないため、数百列を超える場合は別途注意が必要です。',
  order: 40,
  docs: '制限事項（現バージョン）',
};

function makeRows(count: number): string[][] {
  return Array.from({ length: count }, (_, i) => [
    `ID-${String(i + 1).padStart(6, '0')}`,
    `品目 ${i + 1}`,
    String(((i * 37) % 900) + 100),
    String((i % 28) + 1),
  ]);
}

const SIZES = [1_000, 10_000, 100_000];

export default function LargeData() {
  const [size, setSize] = useState(10_000);
  const [data, setData] = useState<string[][]>(() => makeRows(10_000));

  const columns = useMemo(
    () => [
      { title: 'ID', width: 120, readOnly: true },
      { title: '品目', width: 200 },
      { title: '単価', width: 110, type: 'number' as const, format: formatThousands },
      { title: '数量', width: 90, type: 'number' as const },
    ],
    [],
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
            {n.toLocaleString()} 行
          </button>
        ))}
        <span className="ex-note">現在 {data.length.toLocaleString()} 行</span>
      </div>
      <MasumeGrid data={data} onChange={setData} columns={columns} style={{ height: 360 }} />
    </>
  );
}
