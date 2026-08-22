import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル型: テンプレート', en: 'Cell type: template' },
  description: {
    ja:
      'template 型の列は、任意の React コンポーネントをセルに描画します。関数には { row, col, value } が渡り、'
      + 'row は（ソートやフィルタ中でも）data の行インデックスです。中のボタンやリンクはそのままクリックでき、'
      + 'セルの選択とは競合しません。派生表示（他の列から計算した値）と行アクションのボタンが主な用途です。',
    en:
      'A template column renders any React component in the cell. The function receives '
      + '{ row, col, value }, where row is the index into data even while the grid is sorted or '
      + 'filtered. Buttons and links inside receive clicks natively and do not fight the cell '
      + 'selection. The two common uses are derived values and per-row action buttons.',
  },
  order: 6,
  docs: { ja: 'テンプレート型セル', en: 'Template cells' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '数量', '単価', '金額', '操作'],
    rows: [['ノート', '3', '120'], ['ボールペン', '10', '110']],
    remove: '削除',
  },
  en: {
    columns: ['Item', 'Qty', 'Price', 'Amount', 'Actions'],
    rows: [['Notebook', '3', '120'], ['Ballpoint pen', '10', '110']],
    remove: 'Remove',
  },
};

export default function CellTemplate() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: t.columns[0], width: 160 },
        { title: t.columns[1], width: 80, type: 'number' },
        { title: t.columns[2], width: 90, type: 'number' },
        {
          // Derived: computed from the other columns, never stored in data
          title: t.columns[3],
          width: 110,
          type: 'template',
          readOnly: true,
          template: ({ row }) => (
            <span className="ex-amount">
              ¥{(Number(data[row]?.[1] || 0) * Number(data[row]?.[2] || 0)).toLocaleString()}
            </span>
          ),
        },
        {
          // Row action: the button receives its click natively
          title: t.columns[4],
          width: 100,
          type: 'template',
          readOnly: true,
          template: ({ row }) => (
            <button
              type="button"
              className="ex-btn"
              onClick={() => setData((prev) => prev.filter((_, i) => i !== row))}
            >
              {t.remove}
            </button>
          ),
        },
      ]}
      showRowNumbers
      style={{ height: 200 }}
    />
  );
}
