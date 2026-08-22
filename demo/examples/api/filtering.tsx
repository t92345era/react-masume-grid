import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { FilterState, FilterTexts } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'フィルタ（filterable）', en: 'Filtering' },
  description: {
    ja:
      'ヘッダのじょうごボタンから列ごとに絞り込みます。既定は値のチェックリスト、'
      + "filter: 'text' を指定した列はキーワード検索になります。絞り込まれるのは表示だけで、"
      + '隠れた行も data には残ります。パネルの文言は filterTexts で差し替えられます（既定は英語）。',
    en:
      'The funnel button in a header narrows the rows. The default panel is a checklist of the '
      + "column's values; a column with filter: 'text' gets a keyword box instead. Only the view is "
      + 'narrowed — hidden rows stay in data. The panel wording is English by default and can be '
      + 'replaced through filterTexts (this sample switches it with the site language).',
  },
  order: 9,
  docs: { ja: 'フィルタ', en: 'Filtering' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '分類', '単価', '在庫'],
    rows: [
      ['ノート', '文具', '120', 'true'],
      ['ボールペン', '文具', '110', ''],
      ['お茶', '飲料', '150', 'true'],
      ['コーヒー', '飲料', '180', ''],
      ['クリアファイル', '文具', '80', 'true'],
    ],
    state: (f: FilterState) =>
      Object.keys(f).length === 0 ? '現在のフィルタ: なし' : `現在のフィルタ: ${JSON.stringify(f)}`,
    filterTexts: {
      all: '(すべて)',
      blanks: '(空白)',
      checked: '(チェックあり)',
      unchecked: '(チェックなし)',
      search: '検索',
      clear: 'クリア',
      close: '閉じる',
      more: '値が多すぎます — 検索で絞り込んでください',
      button: 'フィルタ',
    } as Partial<FilterTexts>,
  },
  en: {
    columns: ['Item', 'Category', 'Price', 'In stock'],
    rows: [
      ['Notebook', 'Stationery', '120', 'true'],
      ['Ballpoint pen', 'Stationery', '110', ''],
      ['Tea', 'Drinks', '150', 'true'],
      ['Coffee', 'Drinks', '180', ''],
      ['Clear folder', 'Stationery', '80', 'true'],
    ],
    state: (f: FilterState) =>
      Object.keys(f).length === 0 ? 'No filters' : `Filters: ${JSON.stringify(f)}`,
    filterTexts: {} as Partial<FilterTexts>,
  },
};

export default function Filtering() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [filters, setFilters] = useState<FilterState>({});

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          // A column with many distinct values suits a keyword box better
          { title: t.columns[0], width: 180, filter: 'text' },
          { title: t.columns[1], width: 130 },
          { title: t.columns[2], width: 100, type: 'number' },
          { title: t.columns[3], width: 100, type: 'checkbox' },
        ]}
        filterable
        filterTexts={t.filterTexts}
        onFilterChange={setFilters}
        showRowNumbers
        style={{ height: 240 }}
      />
      <p className="ex-note">{t.state(filters)}</p>
    </>
  );
}
