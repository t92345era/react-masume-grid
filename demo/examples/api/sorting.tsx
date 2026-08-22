import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';
import type { SortState } from '../../../src';

export const meta: ExampleMeta = {
  title: 'ソート（sortable）',
  description:
    'sortable を有効にすると、ヘッダクリックで昇順 → 降順 → 解除と切り替わります。'
    + '並ぶのは表示だけで data は並べ替わらないため、onChange や template には常に data の行番号が渡ります。'
    + '型に応じた既定の順序（空セルは最後）が使われ、compare を渡せば列ごとに順序を定義できます。'
    + 'ソート状態はコンポーネント内部に持ち、onSortChange で観測します。',
  order: 8,
  docs: 'ソート',
};

const SIZE_ORDER = ['S', 'M', 'L', 'XL'];

export default function Sorting() {
  const [data, setData] = useState<string[][]>([
    ['ノート', 'M', '120'],
    ['ボールペン', 'S', '110'],
    ['クリアファイル', 'XL', '80'],
    ['ファイルボックス', 'L', '450'],
  ]);
  const [sort, setSort] = useState<SortState | null>({ col: 2, direction: 'asc' });

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品名', width: 180 },
          // S → M → L → XL の順に並べる
          {
            title: 'サイズ',
            width: 100,
            compare: (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
          },
          { title: '単価', width: 100, type: 'number' },
        ]}
        sortable
        defaultSort={{ col: 2, direction: 'asc' }}
        onSortChange={setSort}
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">
        現在のソート: {sort ? `列 ${sort.col} / ${sort.direction}` : 'なし'}
      </p>
    </>
  );
}
