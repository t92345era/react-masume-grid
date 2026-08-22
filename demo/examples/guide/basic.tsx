import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '基本的な使い方',
  description:
    'data と onChange を渡すだけの最小構成です。セルをダブルクリック / F2 / キー入力で編集、'
    + 'ドラッグや Shift + 矢印で範囲選択、Ctrl(⌘) + C / V で Excel との間をコピー＆ペーストできます。'
    + 'data は完全に制御されていて、onChange を実装しない限りグリッドは書き換わりません。',
  order: 1,
  docs: '使い方',
};

export default function Basic() {
  const [data, setData] = useState<string[][]>([
    ['りんご', '100', '果物'],
    ['にんじん', '80', '野菜'],
    ['ぶどう', '400', '果物'],
    ['じゃがいも', '120', '野菜'],
  ]);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: '商品名', width: 160 },
        { title: '単価', width: 100, type: 'number' },
        { title: '分類', width: 120 },
      ]}
      showRowNumbers
      style={{ height: 260 }}
    />
  );
}
