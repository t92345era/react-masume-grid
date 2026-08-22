import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { SortState } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'ソート（sortable）', en: 'Sorting' },
  description: {
    ja:
      'sortable を有効にすると、ヘッダクリックで昇順 → 降順 → 解除と切り替わります。'
      + '並ぶのは表示だけで data は並べ替わらないため、onChange や template には常に data の行番号が渡ります。'
      + '型に応じた既定の順序（空セルは最後）が使われ、compare を渡せば列ごとに順序を定義できます。'
      + 'ソート状態はコンポーネント内部に持ち、onSortChange で観測します。',
    en:
      'With sortable on, clicking a header cycles ascending → descending → unsorted. Only the view is '
      + 'ordered — data is never reordered, so onChange and template always see data indices. Ordering '
      + 'follows the column type by default (empty cells last), and compare defines it per column. The '
      + 'sort state lives inside the component; observe it with onSortChange.',
  },
  order: 8,
  docs: { ja: 'ソート', en: 'Sorting' },
};

const SIZE_ORDER = ['S', 'M', 'L', 'XL'];

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', 'サイズ', '単価'],
    rows: [
      ['ノート', 'M', '120'],
      ['ボールペン', 'S', '110'],
      ['クリアファイル', 'XL', '80'],
      ['ファイルボックス', 'L', '450'],
    ],
    state: (s: SortState | null) => (s ? `現在のソート: 列 ${s.col} / ${s.direction}` : '現在のソート: なし'),
  },
  en: {
    columns: ['Item', 'Size', 'Price'],
    rows: [
      ['Notebook', 'M', '120'],
      ['Ballpoint pen', 'S', '110'],
      ['Clear folder', 'XL', '80'],
      ['File box', 'L', '450'],
    ],
    state: (s: SortState | null) => (s ? `Sorted by column ${s.col}, ${s.direction}` : 'Not sorted'),
  },
};

export default function Sorting() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [sort, setSort] = useState<SortState | null>({ col: 2, direction: 'asc' });

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          // Order as S → M → L → XL
          {
            title: t.columns[1],
            width: 100,
            compare: (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
          },
          { title: t.columns[2], width: 100, type: 'number' },
        ]}
        sortable
        defaultSort={{ col: 2, direction: 'asc' }}
        onSortChange={setSort}
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">{t.state(sort)}</p>
    </>
  );
}
