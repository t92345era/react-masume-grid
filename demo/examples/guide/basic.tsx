import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '基本的な使い方', en: 'Getting started' },
  description: {
    ja:
      'data と onChange を渡すだけの最小構成です。セルをダブルクリック / F2 / キー入力で編集、'
      + 'ドラッグや Shift + 矢印で範囲選択、Ctrl(⌘) + C / V で Excel との間をコピー＆ペーストできます。'
      + 'data は完全に制御されていて、onChange を実装しない限りグリッドは書き換わりません。',
    en:
      'The smallest setup: pass data and onChange. Edit a cell by double-clicking it, pressing F2 '
      + 'or just typing; select ranges by dragging or with Shift + arrows; copy and paste to and from '
      + 'Excel with Ctrl(⌘) + C / V. The data is fully controlled — the grid never changes unless you '
      + 'implement onChange.',
  },
  order: 1,
  docs: { ja: '使い方', en: 'Usage' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['商品名', '単価', '分類'],
    rows: [
      ['りんご', '100', '果物'],
      ['にんじん', '80', '野菜'],
      ['ぶどう', '400', '果物'],
      ['じゃがいも', '120', '野菜'],
    ],
  },
  en: {
    columns: ['Item', 'Price', 'Category'],
    rows: [
      ['Apple', '100', 'Fruit'],
      ['Carrot', '80', 'Vegetable'],
      ['Grapes', '400', 'Fruit'],
      ['Potato', '120', 'Vegetable'],
    ],
  },
};

export default function Basic() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: t.columns[0], width: 160 },
        { title: t.columns[1], width: 100, type: 'number' },
        { title: t.columns[2], width: 120 },
      ]}
      showRowNumbers
      style={{ height: 260 }}
    />
  );
}
