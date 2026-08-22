import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル型: 選択肢（select）', en: 'Cell type: select' },
  description: {
    ja:
      'options にマスタデータを渡すとプルダウンになります。{ value, label } の形なら'
      + '「コードを保存してラベルを表示する」動きになり、data に入るのは value（下の表示で確認できます）。'
      + '既定では入力に応じて候補が絞り込まれ（searchable）、options にない値は受け付けません（strict）。'
      + 'どちらも列ごとに false にできます。',
    en:
      'Passing master data as options turns the column into a dropdown. In { value, label } form it '
      + 'stores the code and displays the label — data holds the value, as the dump below shows. By '
      + 'default the list narrows as you type (searchable) and values outside options are rejected '
      + '(strict); both can be turned off per column.',
  },
  order: 3,
  docs: { ja: 'セル型', en: 'Cell types' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['商品名', '分類', '産地'],
    categories: [
      { value: 'C01', label: '果物' },
      { value: 'C02', label: '野菜' },
      { value: 'C03', label: '飲料' },
    ],
    origins: ['国産', '輸入'],
    rows: [['りんご', 'C01', '国産'], ['にんじん', 'C02', '']],
  },
  en: {
    columns: ['Item', 'Category', 'Origin'],
    categories: [
      { value: 'C01', label: 'Fruit' },
      { value: 'C02', label: 'Vegetable' },
      { value: 'C03', label: 'Drink' },
    ],
    origins: ['Domestic', 'Imported'],
    rows: [['Apple', 'C01', 'Domestic'], ['Carrot', 'C02', '']],
  },
};

export default function CellSelect() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 160 },
          // Stores the code, displays the label
          { title: t.columns[1], width: 130, type: 'select', options: t.categories },
          // Keeps the full option list and accepts values outside it
          {
            title: t.columns[2],
            width: 140,
            type: 'select',
            options: t.origins,
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
