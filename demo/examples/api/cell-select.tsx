import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル型: 選択肢（select）',
  description:
    'options にマスタデータを渡すとプルダウンになります。{ value, label } の形なら'
    + '「コードを保存してラベルを表示する」動きになり、data に入るのは value（下の表示で確認できます）。'
    + '既定では入力に応じて候補が絞り込まれ（searchable）、options にない値は受け付けません（strict）。'
    + 'どちらも列ごとに false にできます。',
  order: 3,
  docs: 'セル型',
};

const CATEGORIES = [
  { value: 'C01', label: '果物' },
  { value: 'C02', label: '野菜' },
  { value: 'C03', label: '飲料' },
];

export default function CellSelect() {
  const [data, setData] = useState<string[][]>([
    ['りんご', 'C01', '国産'],
    ['にんじん', 'C02', ''],
  ]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '商品名', width: 160 },
          // コード保存・ラベル表示
          { title: '分類', width: 120, type: 'select', options: CATEGORIES },
          // 候補は絞り込まず、一覧にない値も許可する列
          {
            title: '産地',
            width: 140,
            type: 'select',
            options: ['国産', '輸入'],
            searchable: false,
            strict: false,
          },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">data: {JSON.stringify(data)}</p>
    </>
  );
}
