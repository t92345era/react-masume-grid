import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'イベント',
  description:
    'onChange は変更後の2次元配列を、onCellChange は変更されたセルを1つずつ受け取ります（併用可）。'
    + 'onSelectionChange の範囲は表示行なので、ソート・フィルタ中に data の行へ戻すための viewToData が'
    + '第2引数で渡ります（どちらでもないときは null）。onColumnResize はドラッグ完了時の最終幅です。'
    + '下のセルを編集・選択すると、発火したイベントが上から順に積まれます。',
  order: 13,
  docs: 'Props',
};

export default function Events() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120'],
    ['ボールペン', '110'],
    ['クリアファイル', '80'],
  ]);
  const [log, setLog] = useState<string[]>([]);
  const push = (line: string) => setLog((prev) => [line, ...prev].slice(0, 8));

  return (
    <>
      <MasumeGrid
        data={data}
        columns={[
          { title: '品名', width: 180 },
          { title: '単価', width: 100, type: 'number' },
        ]}
        onChange={(next) => {
          setData(next);
          push(`onChange: ${next.length} 行`);
        }}
        onCellChange={(row, col, value) =>
          push(`onCellChange: (${row}, ${col}) → ${JSON.stringify(value)}`)
        }
        onSelectionChange={(ranges, viewToData) => {
          const r = ranges[ranges.length - 1];
          if (!r) return;
          push(
            `onSelectionChange: R${r.top + 1}C${r.left + 1}:R${r.bottom + 1}C${r.right + 1}`
              + (viewToData ? ` / data 行 ${viewToData[r.top]}` : ''),
          );
        }}
        onColumnResize={(col, width) => push(`onColumnResize: 列 ${col} → ${width}px`)}
        sortable
        onSortChange={(sort) => push(`onSortChange: ${sort ? `列 ${sort.col} ${sort.direction}` : 'null'}`)}
        showRowNumbers
        style={{ height: 200 }}
      />
      <ol className="ex-log">
        {log.length === 0 ? <li>セルを選択・編集してみてください</li> : log.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
    </>
  );
}
