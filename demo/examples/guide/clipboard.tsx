import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'Excel とのコピー＆ペースト', en: 'Copy & paste with Excel' },
  description: {
    ja:
      'Ctrl(⌘) + C / X / V が Excel・Google スプレッドシートと相互運用できる TSV 形式で動きます。'
      + 'コピーした範囲は Excel と同じ動く点線枠で示され、1セルだけコピーして広い範囲に貼ると全体に敷き詰められます。'
      + 'appendBlankRow が有効なら、最終行を超える貼り付けでも切り捨てずに行が増えます（下の表は3行ですが、'
      + 'Excel から10行貼り付ければ10行になります）。',
    en:
      'Ctrl(⌘) + C / X / V work in the TSV format Excel and Google Sheets understand. The copied range '
      + 'gets Excel\'s marching-ants outline, and a single copied cell tiles across a larger selection. '
      + 'With appendBlankRow on, a paste that runs past the last row grows the data instead of being '
      + 'clipped — the grid below holds three rows, but paste ten from Excel and it will hold ten.',
  },
  order: 3,
  docs: { ja: '使い方', en: 'Usage' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    hint:
      'Excel の表をコピーしてこのグリッドに貼り付けてみてください。逆に、範囲を選んで Ctrl(⌘) + C '
      + 'でコピーすると、そのまま Excel に貼り付けられます。',
    rows: (n: number) => `現在 ${n} 行`,
    columns: ['品番', '品名', '数量', '単価'],
    data: [
      ['A-001', '複合機トナー', '3', '12000'],
      ['A-002', 'コピー用紙 A4', '20', '450'],
      ['A-003', 'ボールペン 黒', '50', '110'],
    ],
  },
  en: {
    hint:
      'Copy a block of cells in Excel and paste it here. The other way round works too: select a range, '
      + 'press Ctrl(⌘) + C, and paste it straight into Excel.',
    rows: (n: number) => `${n} rows`,
    columns: ['Code', 'Item', 'Qty', 'Unit price'],
    data: [
      ['A-001', 'Toner cartridge', '3', '12000'],
      ['A-002', 'Copy paper A4', '20', '450'],
      ['A-003', 'Ballpoint pen', '50', '110'],
    ],
  },
};

export default function Clipboard() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.data);

  return (
    <>
      <p className="ex-hint">{t.hint}</p>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 100 },
          { title: t.columns[1], width: 200 },
          { title: t.columns[2], width: 80, type: 'number' },
          { title: t.columns[3], width: 110, type: 'number' },
        ]}
        appendBlankRow
        showRowNumbers
        style={{ height: 260 }}
      />
      <p className="ex-note">{t.rows(data.length)}</p>
    </>
  );
}
