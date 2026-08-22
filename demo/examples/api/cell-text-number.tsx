import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル型: 文字列・数値', en: 'Cell types: text & number' },
  description: {
    ja:
      'type を省略すると文字列型です。number 型は右寄せになり、入力は正規化されます —'
      + '全角数字「１２３」は 123 に、カンマ入りの「1,234」は 1234 になり、数値にならない入力は受け付けません。'
      + '内部データは常に文字列なので、数値も "1234" として保持されます。',
    en:
      'Omitting type gives a text column. A number column is right-aligned and normalizes its input: '
      + 'full-width digits 「１２３」 become 123, "1,234" becomes 1234, and anything that is not a number '
      + 'is rejected. Values are always stored as strings, so a number is kept as "1234".',
  },
  order: 2,
  docs: { ja: 'セル型', en: 'Cell types' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価'],
    rows: [['ノート', '120'], ['ボールペン', '110'], ['', '']],
    hint: '「単価」の列に全角で「１２３４」やカンマ付きで「1,234」と入力すると、確定時に 1234 になります。',
  },
  en: {
    columns: ['Item', 'Price'],
    rows: [['Notebook', '120'], ['Ballpoint pen', '110'], ['', '']],
    hint: 'Type 「１２３４」 (full-width) or "1,234" into the Price column: both commit as 1234.',
  },
};

export default function CellTextNumber() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <>
      <p className="ex-hint">{t.hint}</p>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 110, type: 'number' },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">data: {JSON.stringify(data)}</p>
    </>
  );
}
