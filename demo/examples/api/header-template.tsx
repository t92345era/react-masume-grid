import { useState } from 'react';
import { MasumeGrid, isCheckboxChecked } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'ヘッダーのテンプレート化',
  description:
    'headerTemplate は列見出しの描画を差し替えます。どのセル型の列にも指定でき、'
    + 'ソート矢印・フィルタボタン・列幅ハンドルはそのまま機能します。ヘッダー内のボタンを押しても'
    + 'ソートや列選択は起きません。title は残しておいてください（フィルタボタンの読み上げ名に使われます）。',
  order: 7,
  docs: 'ヘッダーのテンプレート化',
};

export default function HeaderTemplate() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120', 'true'],
    ['ボールペン', '110', ''],
    ['クリアファイル', '80', 'true'],
  ]);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: '品名', width: 180 },
        {
          // 単位を副題にした2段見出し
          title: '単価',
          width: 110,
          type: 'number',
          headerTemplate: ({ title }) => (
            <span className="ex-hcell-stacked">
              {title}
              <span className="ex-hcell-unit">税抜 / 円</span>
            </span>
          ),
        },
        {
          // データから算出した件数バッジと、ヘッダー内のボタン
          title: '確認済',
          width: 130,
          type: 'checkbox',
          headerTemplate: ({ title }) => (
            <span className="ex-hcell-badge">
              {title}
              <span>{data.filter((r) => isCheckboxChecked(r[2] ?? '')).length}</span>
              <button
                type="button"
                className="ex-hcell-btn"
                onClick={() => setData((prev) => prev.map((r) => [r[0], r[1], '']))}
              >
                解除
              </button>
            </span>
          ),
        },
      ]}
      sortable
      showRowNumbers
      style={{ height: 220 }}
    />
  );
}
