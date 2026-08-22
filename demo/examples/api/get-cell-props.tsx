import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'セル単位の上書き（getCellProps）', en: 'Per-cell overrides' },
  description: {
    ja:
      '(row, col, value) を受け取り、そのセルの readOnly / className / style を返します。'
      + 'readOnly は編集・貼り付け・削除のすべてに効き、グリッド全体や列の readOnly に上乗せされます。'
      + 'className は追加され、style は併合されます（グリッドが管理する width / height は上書きできません）。'
      + '表示中のセルごとに毎回呼ばれるので、重い計算は入れないでください。'
      + 'なお className で背景色などを変えるときは .masume-grid-cell.my-class のように書いてください —'
      + 'クラス1つだけではライブラリ側のセル指定と詳細度が並び、CSS の読み込み順で負けることがあります'
      + '（style で渡せばこの問題は起きません）。',
    en:
      'It receives (row, col, value) and returns readOnly / className / style for that cell. readOnly '
      + 'covers edits, paste and delete alike, on top of the grid-level and column-level readOnly. '
      + 'className is appended and style is merged (the grid-managed width / height cannot be '
      + 'overridden). It runs for every visible cell on each render, so keep it cheap. When a class '
      + 'changes something the grid already paints, qualify it as .masume-grid-cell.my-class — a lone '
      + "class ties with the library's rule and loses on stylesheet order (style never has this issue).",
  },
  order: 11,
  docs: { ja: 'セル単位の上書き', en: 'Per-cell overrides' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価', '締め'],
    rows: [['ノート', '120', ''], ['ボールペン', '0', 'true'], ['クリアファイル', '80', '']],
    note: '2行目の「締め」にチェックを入れると、その行の他のセルがロックされます。',
  },
  en: {
    columns: ['Item', 'Price', 'Closed'],
    rows: [['Notebook', '120', ''], ['Ballpoint pen', '0', 'true'], ['Clear folder', '80', '']],
    note: 'Tick "Closed" on a row and the rest of that row locks.',
  },
};

export default function GetCellProps() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 100, type: 'number' },
          { title: t.columns[2], width: 100, type: 'checkbox' },
        ]}
        getCellProps={(row, col, value) => {
          // A closed row locks every column except the checkbox itself
          if (data[row]?.[2] === 'true' && col !== 2)
            return { readOnly: true, className: 'ex-locked' };
          // Warn on a price of 0
          if (col === 1 && value !== '' && Number(value) === 0) return { className: 'ex-invalid' };
        }}
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">{t.note}</p>
    </>
  );
}
