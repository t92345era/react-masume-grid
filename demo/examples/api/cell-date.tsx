import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル型: 日付（date）',
  description:
    'カレンダー入力になり、data には YYYY-MM-DD で保存されます。貼り付けたテキストは'
    + '2026/1/5、2026年1月5日、20260105 のような表記でも正規化されます。'
    + '表示だけ和暦や別書式にしたい場合は format を併用します（表示フォーマットのサンプルを参照）。',
  order: 4,
  docs: 'セル型',
};

export default function CellDate() {
  const [data, setData] = useState<string[][]>([
    ['入荷', '2026-01-05'],
    ['出荷', '2026-02-14'],
    ['棚卸', ''],
  ]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '区分', width: 120 },
          {
            title: '日付',
            width: 140,
            type: 'date',
            // 表示だけ「2026年1月5日」にする（保存値は YYYY-MM-DD のまま）
            format: (v) => {
              const [y, m, d] = v.split('-');
              return `${y}年${Number(m)}月${Number(d)}日`;
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
