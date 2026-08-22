import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル型: テンプレート',
  description:
    'template 型の列は、任意の React コンポーネントをセルに描画します。関数には { row, col, value } が渡り、'
    + 'row は（ソートやフィルタ中でも）data の行インデックスです。中のボタンやリンクはそのままクリックでき、'
    + 'セルの選択とは競合しません。派生表示（他の列から計算した値）と行アクションのボタンが主な用途です。',
  order: 6,
  docs: 'テンプレート型セル',
};

export default function CellTemplate() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '3', '120'],
    ['ボールペン', '10', '110'],
  ]);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: '品名', width: 160 },
        { title: '数量', width: 80, type: 'number' },
        { title: '単価', width: 90, type: 'number' },
        {
          // 派生表示: data には持たせず、他の列から計算して描画する
          title: '金額',
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
          // 行アクション: ボタンはネイティブにクリックできる
          title: '操作',
          width: 90,
          type: 'template',
          readOnly: true,
          template: ({ row }) => (
            <button
              type="button"
              className="ex-btn"
              onClick={() => setData((prev) => prev.filter((_, i) => i !== row))}
            >
              削除
            </button>
          ),
        },
      ]}
      showRowNumbers
      style={{ height: 200 }}
    />
  );
}
