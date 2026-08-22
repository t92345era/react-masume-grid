import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '表示オプション', en: 'Display options' },
  description: {
    ja:
      '行番号・ヘッダーの表示、読み取り専用、行やヘッダーの高さ、列幅の既定値を切り替えられます。'
      + '高さは style（または CSS）で指定します（既定は 420px）。読み取り専用にしても選択とコピーは効きます。'
      + 'ソートとフィルタと列幅リサイズはヘッダーの操作なので、showHeader が false のときは使えません。',
    en:
      'Toggle the row numbers and the header, make the grid read-only, change the row and header '
      + 'heights, or the default column width. The overall height comes from style (or CSS); it '
      + 'defaults to 420px. A read-only grid still supports selection and copying. Sorting, filtering '
      + 'and column resizing are header gestures, so they need showHeader.',
  },
  order: 15,
  docs: { ja: 'Props', en: 'Props' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価', '分類'],
    rows: [['ノート', '120', '文具'], ['ボールペン', '110', '文具'], ['お茶', '150', '飲料']],
    rowNumbers: '行番号',
    header: 'ヘッダー',
    readOnly: '読み取り専用',
    dense: '行を詰める',
  },
  en: {
    columns: ['Item', 'Price', 'Category'],
    rows: [
      ['Notebook', '120', 'Stationery'],
      ['Ballpoint pen', '110', 'Stationery'],
      ['Tea', '150', 'Drinks'],
    ],
    rowNumbers: 'Row numbers',
    header: 'Header',
    readOnly: 'Read-only',
    dense: 'Dense rows',
  },
};

export default function Layout() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [showRowNumbers, setShowRowNumbers] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [dense, setDense] = useState(false);

  return (
    <>
      <div className="ex-toolbar">
        <label>
          <input
            type="checkbox"
            checked={showRowNumbers}
            onChange={(e) => setShowRowNumbers(e.target.checked)}
          />
          {t.rowNumbers}
        </label>
        <label>
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => setShowHeader(e.target.checked)}
          />
          {t.header}
        </label>
        <label>
          <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
          {t.readOnly}
        </label>
        <label>
          <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
          {t.dense}
        </label>
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], type: 'number' },
          { title: t.columns[2] },
        ]}
        showRowNumbers={showRowNumbers}
        showHeader={showHeader}
        readOnly={readOnly}
        rowHeight={dense ? 22 : 28}
        headerHeight={dense ? 24 : 28}
        defaultColumnWidth={110}
        rowNumberWidth={40}
        style={{ height: 200 }}
      />
    </>
  );
}
