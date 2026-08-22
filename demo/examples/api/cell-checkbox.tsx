import { useState } from 'react';
import { MasumeGrid, isCheckboxChecked } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル型: チェックボックス', en: 'Cell type: checkbox' },
  description: {
    ja:
      'クリックまたは Space でトグルします（複数セルを選んで Space を押すと、選択範囲のチェックが一括で切り替わります）。'
      + '保存値はオンが "true"、オフが空文字です。Excel から貼り付けた TRUE/FALSE、1/0、yes/no も正規化されます。'
      + '値の判定には、エクスポートしている isCheckboxChecked が使えます。',
    en:
      'Toggled by clicking or pressing Space — select several cells and Space flips them all. The '
      + 'stored value is "true" when checked and an empty string when not. Text pasted from Excel is '
      + 'normalized, including TRUE/FALSE, 1/0 and yes/no. Use the exported isCheckboxChecked helper '
      + 'to test a value.',
  },
  order: 5,
  docs: { ja: 'セル型', en: 'Cell types' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['氏名', '出席'],
    rows: [['山田 太郎', 'true'], ['鈴木 花子', ''], ['佐藤 次郎', 'true']],
    count: (done: number, all: number) => `出席 ${done} / ${all} 名`,
  },
  en: {
    columns: ['Name', 'Present'],
    rows: [['Alex Turner', 'true'], ['Priya Nair', ''], ['Sam Okafor', 'true']],
    count: (done: number, all: number) => `${done} of ${all} present`,
  },
};

export default function CellCheckbox() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  const done = data.filter((row) => isCheckboxChecked(row[1] ?? '')).length;

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 160 },
          { title: t.columns[1], width: 100, type: 'checkbox' },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">
        {t.count(done, data.length)} — data: {JSON.stringify(data)}
      </p>
    </>
  );
}
