import { useState } from 'react';
import { MasumeGrid, isCheckboxChecked } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'ヘッダーのテンプレート化', en: 'Header templates' },
  description: {
    ja:
      'headerTemplate は列見出しの描画を差し替えます。どのセル型の列にも指定でき、'
      + 'ソート矢印・フィルタボタン・列幅ハンドルはそのまま機能します。ヘッダー内のボタンを押しても'
      + 'ソートや列選択は起きません。title は残しておいてください（フィルタボタンの読み上げ名に使われます）。',
    en:
      'headerTemplate replaces how a column caption is rendered. It works on any column type, and the '
      + 'sort indicator, filter button and resize handle keep working around it. A button inside the '
      + 'header receives its click without sorting or selecting the column. Keep title set as well — '
      + "it is still the filter button's accessible name.",
  },
  order: 7,
  docs: { ja: 'ヘッダーのテンプレート化', en: 'Header templates' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価', '確認済'],
    unit: '税抜 / 円',
    clear: '解除',
    rows: [['ノート', '120', 'true'], ['ボールペン', '110', ''], ['クリアファイル', '80', 'true']],
  },
  en: {
    columns: ['Item', 'Price', 'Checked'],
    unit: 'excl. tax / JPY',
    clear: 'Clear',
    rows: [['Notebook', '120', 'true'], ['Ballpoint pen', '110', ''], ['Clear folder', '80', 'true']],
  },
};

export default function HeaderTemplate() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: t.columns[0], width: 180 },
        {
          // Two-line caption with the unit as a subtitle
          title: t.columns[1],
          width: 130,
          type: 'number',
          headerTemplate: ({ title }) => (
            <span className="ex-hcell-stacked">
              {title}
              <span className="ex-hcell-unit">{t.unit}</span>
            </span>
          ),
        },
        {
          // A count badge computed from the data, plus a button in the header
          title: t.columns[2],
          width: 150,
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
                {t.clear}
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
