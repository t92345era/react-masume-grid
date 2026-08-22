import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '日本語入力（IME）',
  description:
    'IME をオンにしたままセルを選んで「A」と打つと、セルが編集状態になり「あ」がそのまま入ります。'
    + '変換中の Enter は確定だけを行い、セルは移動しません（もう一度 Enter で下のセルへ）。'
    + '文字列・選択肢・日付のどのセル型でも同じように入力できます。特別な設定は不要です。',
  order: 2,
  docs: 'セル型',
};

export default function Ime() {
  const [data, setData] = useState<string[][]>([
    ['山田 太郎', 'ヤマダ タロウ', 'C01', '2026-04-01', ''],
    ['鈴木 花子', 'スズキ ハナコ', 'C02', '2026-04-15', ''],
    ['', '', '', '', ''],
  ]);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: '氏名', width: 140 },
        { title: 'フリガナ', width: 160 },
        {
          title: '部署',
          width: 120,
          type: 'select',
          options: [
            { value: 'C01', label: '営業部' },
            { value: 'C02', label: '開発部' },
            { value: 'C03', label: '総務部' },
          ],
        },
        { title: '入社日', width: 130, type: 'date' },
        { title: '備考', width: 220 },
      ]}
      showRowNumbers
      appendBlankRow
      style={{ height: 260 }}
    />
  );
}
