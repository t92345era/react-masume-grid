import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '日本語入力（IME）', en: 'Japanese IME input' },
  description: {
    ja:
      'IME をオンにしたままセルを選んで「A」と打つと、セルが編集状態になり「あ」がそのまま入ります。'
      + '変換中の Enter は確定だけを行い、セルは移動しません（もう一度 Enter で下のセルへ）。'
      + '文字列・選択肢・日付のどのセル型でも同じように入力できます。特別な設定は不要です。',
    en:
      'With a Japanese IME switched on, select a cell and press "A": the editor opens and 「あ」 lands '
      + 'straight in the cell. The Enter that confirms a composition only confirms it — the cell does '
      + 'not move (press Enter again to go down). It works the same in text, select and date cells, '
      + 'with no configuration. If you have an IME installed, try it right here.',
  },
  order: 2,
  docs: { ja: 'セル型', en: 'Cell types' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['氏名', 'フリガナ', '部署', '入社日', '備考'],
    options: [
      { value: 'C01', label: '営業部' },
      { value: 'C02', label: '開発部' },
      { value: 'C03', label: '総務部' },
    ],
    rows: [
      ['山田 太郎', 'ヤマダ タロウ', 'C01', '2026-04-01', ''],
      ['鈴木 花子', 'スズキ ハナコ', 'C02', '2026-04-15', ''],
      ['', '', '', '', ''],
    ],
  },
  en: {
    columns: ['Name', 'Kana', 'Department', 'Joined', 'Notes'],
    options: [
      { value: 'C01', label: 'Sales' },
      { value: 'C02', label: 'Engineering' },
      { value: 'C03', label: 'Admin' },
    ],
    rows: [
      ['山田 太郎', 'ヤマダ タロウ', 'C01', '2026-04-01', ''],
      ['鈴木 花子', 'スズキ ハナコ', 'C02', '2026-04-15', ''],
      ['', '', '', '', ''],
    ],
  },
};

export default function Ime() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: t.columns[0], width: 140 },
        { title: t.columns[1], width: 160 },
        { title: t.columns[2], width: 130, type: 'select', options: t.options },
        { title: t.columns[3], width: 130, type: 'date' },
        { title: t.columns[4], width: 220 },
      ]}
      showRowNumbers
      appendBlankRow
      style={{ height: 260 }}
    />
  );
}
