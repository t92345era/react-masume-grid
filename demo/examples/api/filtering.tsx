import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { FilterState, FilterTexts } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'フィルタ（filterable）',
  description:
    'ヘッダのじょうごボタンから列ごとに絞り込みます。既定は値のチェックリスト、'
    + "filter: 'text' を指定した列はキーワード検索になります。絞り込まれるのは表示だけで、"
    + '隠れた行も data には残ります。パネルの文言は filterTexts で差し替えられます（既定は英語）。',
  order: 9,
  docs: 'フィルタ',
};

const FILTER_TEXTS: Partial<FilterTexts> = {
  all: '(すべて)',
  blanks: '(空白)',
  checked: '(チェックあり)',
  unchecked: '(チェックなし)',
  search: '検索',
  clear: 'クリア',
  close: '閉じる',
  more: '値が多すぎます — 検索で絞り込んでください',
  button: 'フィルタ',
};

export default function Filtering() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '文具', '120', 'true'],
    ['ボールペン', '文具', '110', ''],
    ['お茶', '飲料', '150', 'true'],
    ['コーヒー', '飲料', '180', ''],
    ['クリアファイル', '文具', '80', 'true'],
  ]);
  const [filters, setFilters] = useState<FilterState>({});

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          // 値の種類が多い列はチェックリストよりキーワード検索が向く
          { title: '品名', width: 180, filter: 'text' },
          { title: '分類', width: 110 },
          { title: '単価', width: 100, type: 'number' },
          { title: '在庫', width: 90, type: 'checkbox' },
        ]}
        filterable
        filterTexts={FILTER_TEXTS}
        onFilterChange={setFilters}
        showRowNumbers
        style={{ height: 240 }}
      />
      <p className="ex-note">
        現在のフィルタ: {Object.keys(filters).length === 0 ? 'なし' : JSON.stringify(filters)}
      </p>
    </>
  );
}
