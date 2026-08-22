import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '表示オプション',
  description:
    '行番号・ヘッダーの表示、読み取り専用、行やヘッダーの高さ、列幅の既定値を切り替えられます。'
    + '高さは style（または CSS）で指定します（既定は 420px）。読み取り専用にしても選択とコピーは効きます。'
    + 'ソートとフィルタと列幅リサイズはヘッダーの操作なので、showHeader が false のときは使えません。',
  order: 15,
  docs: 'Props',
};

export default function Layout() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120', '文具'],
    ['ボールペン', '110', '文具'],
    ['お茶', '150', '飲料'],
  ]);
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
          行番号
        </label>
        <label>
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => setShowHeader(e.target.checked)}
          />
          ヘッダー
        </label>
        <label>
          <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
          読み取り専用
        </label>
        <label>
          <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
          行を詰める
        </label>
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[{ title: '品名', width: 180 }, { title: '単価', type: 'number' }, { title: '分類' }]}
        showRowNumbers={showRowNumbers}
        showHeader={showHeader}
        readOnly={readOnly}
        rowHeight={dense ? 22 : 28}
        headerHeight={dense ? 24 : 28}
        defaultColumnWidth={100}
        rowNumberWidth={40}
        style={{ height: 200 }}
      />
    </>
  );
}
