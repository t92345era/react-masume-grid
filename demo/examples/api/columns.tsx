import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '列定義（columns）', en: 'Column definitions' },
  description: {
    ja:
      'columns は列ごとの { title, width, readOnly, resizable, ... } の配列です。省略すると列数が data の'
      + '最長行から決まり、ヘッダーは A, B, C… になります。下のボタンで切り替えられます。'
      + '列幅はヘッダーの境界をドラッグして変更でき、ドラッグで決めた幅はコンポーネント内部に保持されます'
      + '（保存したい場合は onColumnResize で受け取ります）。',
    en:
      'columns is an array of { title, width, readOnly, resizable, ... }, one per column. Omit it and '
      + 'the column count follows the longest row in data, with spreadsheet letters (A, B, C, …) as '
      + 'headers — the button below switches between the two. Widths can be dragged from the header '
      + 'edges, and a dragged width is kept inside the component (persist it via onColumnResize).',
  },
  order: 1,
  docs: { ja: 'Props', en: 'Props' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['商品名', '単価', '分類'],
    rows: [
      ['りんご', '100', '果物'],
      ['にんじん', '80', '野菜'],
    ],
    on: 'columns あり',
    off: 'columns なし（A, B, C…）',
  },
  en: {
    columns: ['Item', 'Price', 'Category'],
    rows: [
      ['Apple', '100', 'Fruit'],
      ['Carrot', '80', 'Vegetable'],
    ],
    on: 'With columns',
    off: 'Without columns (A, B, C…)',
  },
};

export default function Columns() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [useColumns, setUseColumns] = useState(true);

  return (
    <>
      <div className="ex-toolbar">
        <button
          type="button"
          className={'ex-btn' + (useColumns ? ' ex-btn--on' : '')}
          onClick={() => setUseColumns((v) => !v)}
        >
          {useColumns ? t.on : t.off}
        </button>
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={
          useColumns
            ? [
                { title: t.columns[0], width: 160 },
                { title: t.columns[1], width: 90, type: 'number' },
                // This column alone allows neither editing nor resizing
                { title: t.columns[2], width: 120, readOnly: true, resizable: false },
              ]
            : undefined
        }
        style={{ height: 200 }}
      />
    </>
  );
}
