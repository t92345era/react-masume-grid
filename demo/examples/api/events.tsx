import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'イベント', en: 'Events' },
  description: {
    ja:
      'onChange は変更後の2次元配列を、onCellChange は変更されたセルを1つずつ受け取ります（併用可）。'
      + 'onSelectionChange の範囲は表示行なので、ソート・フィルタ中に data の行へ戻すための viewToData が'
      + '第2引数で渡ります（どちらでもないときは null）。onColumnResize はドラッグ完了時の最終幅です。'
      + '下のセルを編集・選択すると、発火したイベントが上から順に積まれます。',
    en:
      'onChange receives the whole new 2D array; onCellChange receives one changed cell at a time '
      + '(use either or both). The ranges given to onSelectionChange are display rows, so viewToData '
      + 'comes alongside to map them back to data rows while sorted or filtered (null when neither). '
      + 'onColumnResize reports the final width when a drag ends. Edit or select below and the events '
      + 'stack up newest first.',
  },
  order: 13,
  docs: { ja: 'Props', en: 'Props' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価'],
    rows: [['ノート', '120'], ['ボールペン', '110'], ['クリアファイル', '80']],
    empty: 'セルを選択・編集してみてください',
    rowsLabel: (n: number) => `onChange: ${n} 行`,
    dataRow: (n: number) => ` / data 行 ${n}`,
    resize: (col: number, w: number) => `onColumnResize: 列 ${col} → ${w}px`,
    sort: (s: string) => `onSortChange: ${s}`,
  },
  en: {
    columns: ['Item', 'Price'],
    rows: [['Notebook', '120'], ['Ballpoint pen', '110'], ['Clear folder', '80']],
    empty: 'Select or edit a cell to see the events',
    rowsLabel: (n: number) => `onChange: ${n} rows`,
    dataRow: (n: number) => ` / data row ${n}`,
    resize: (col: number, w: number) => `onColumnResize: column ${col} → ${w}px`,
    sort: (s: string) => `onSortChange: ${s}`,
  },
};

export default function Events() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [log, setLog] = useState<string[]>([]);
  const push = (line: string) => setLog((prev) => [line, ...prev].slice(0, 8));

  return (
    <>
      <MasumeGrid
        data={data}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 100, type: 'number' },
        ]}
        onChange={(next) => {
          setData(next);
          push(t.rowsLabel(next.length));
        }}
        onCellChange={(row, col, value) =>
          push(`onCellChange: (${row}, ${col}) → ${JSON.stringify(value)}`)
        }
        onSelectionChange={(ranges, viewToData) => {
          const r = ranges[ranges.length - 1];
          if (!r) return;
          push(
            `onSelectionChange: R${r.top + 1}C${r.left + 1}:R${r.bottom + 1}C${r.right + 1}`
              + (viewToData ? t.dataRow(viewToData[r.top]) : ''),
          );
        }}
        onColumnResize={(col, width) => push(t.resize(col, width))}
        sortable
        onSortChange={(sort) => push(t.sort(sort ? `${sort.col} ${sort.direction}` : 'null'))}
        showRowNumbers
        style={{ height: 200 }}
      />
      <ol className="ex-log">
        {log.length === 0 ? <li>{t.empty}</li> : log.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
    </>
  );
}
