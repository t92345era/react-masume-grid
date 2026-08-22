import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '末尾の空行（appendBlankRow）', en: 'Trailing blank row' },
  description: {
    ja:
      'Excel や Access の「新規行」のように、末尾に空行を1行だけ表示します。data 自体は増えないので、'
      + 'そこに値を確定した時点で onChange に1行長い配列が渡り、あらためて下に空行が現れます。'
      + '最終行を超える貼り付けも切り捨てず、必要なだけ行が増えます（増えた行は必ず data の末尾に付きます）。',
    en:
      'One empty row below the data, like the "new record" row in Excel or Access. data itself does '
      + 'not grow: committing a value there calls onChange with an array one row longer, and a fresh '
      + 'blank row appears again below it. A paste that runs past the last row grows the data by as '
      + 'many rows as it needs, always appending them at the end.',
  },
  order: 10,
  docs: { ja: '末尾の空行', en: 'Trailing blank row' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価'],
    rows: [['ノート', '120']],
    blankHint: '  ← 空行に入力 = 行が増える',
    count: (n: number) => `data は ${n} 行（表示されている空行は含みません）`,
  },
  en: {
    columns: ['Item', 'Price'],
    rows: [['Notebook', '120']],
    blankHint: '  ← typed in the blank row, so a row is added',
    count: (n: number) => `data holds ${n} rows (the blank row is not one of them)`,
  },
};

export default function AppendBlankRow() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [log, setLog] = useState<string[]>([]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        onCellChange={(row, col, value) =>
          setLog((prev) =>
            [
              `onCellChange(${row}, ${col}, ${JSON.stringify(value)})`
                + (row === data.length ? t.blankHint : ''),
              ...prev,
            ].slice(0, 6),
          )
        }
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 100, type: 'number' },
        ]}
        appendBlankRow
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">{t.count(data.length)}</p>
      <ol className="ex-log">
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </>
  );
}
