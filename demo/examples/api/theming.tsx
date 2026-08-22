import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'スタイルのカスタマイズ', en: 'Theming' },
  description: {
    ja:
      'className を付けて CSS 変数を上書きすればテーマを変えられます。アクセントカラー'
      + '（--masume-grid-accent）は選択枠だけでなく、コピー範囲の点線・ソート矢印・絞り込み中のじょうごにも使われます。'
      + 'セレクタは .masume-grid.my-theme のように書いてください — .my-theme だけだと'
      + 'ライブラリ側の .masume-grid と詳細度が並び、CSS の読み込み順で勝ち負けが変わってしまいます。',
    en:
      'Add a className and override the CSS variables to theme the grid. The accent '
      + '(--masume-grid-accent) colors more than the selection outline: the marching ants on a copied '
      + 'range, the sort indicator and the funnel of an active filter all follow it. Write the selector '
      + 'as .masume-grid.my-theme — a lone .my-theme ties with the library\'s own rule, and then '
      + 'stylesheet order decides the winner.',
  },
  order: 14,
  docs: { ja: 'スタイルのカスタマイズ', en: 'Styling' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価'],
    rows: [['ノート', '120'], ['ボールペン', '110'], ['クリアファイル', '80']],
    themes: ['既定', 'グリーン', 'ダーク'],
  },
  en: {
    columns: ['Item', 'Price'],
    rows: [['Notebook', '120'], ['Ballpoint pen', '110'], ['Clear folder', '80']],
    themes: ['Default', 'Green', 'Dark'],
  },
};

const THEME_CLASSES = ['', 'ex-theme-green', 'ex-theme-dark'];

/*
.masume-grid.ex-theme-green {
  --masume-grid-accent: #0f9d58;
  --masume-grid-sel-bg: rgba(15, 157, 88, 0.12);
  --masume-grid-header-bg: #f0f4f1;
  --masume-grid-header-sel-bg: #d9ece1;
}
*/

export default function Theming() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);
  const [theme, setTheme] = useState('ex-theme-green');

  return (
    <>
      <div className="ex-toolbar">
        {THEME_CLASSES.map((id, i) => (
          <button
            key={id}
            type="button"
            className={'ex-btn' + (id === theme ? ' ex-btn--on' : '')}
            onClick={() => setTheme(id)}
          >
            {t.themes[i]}
          </button>
        ))}
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 100, type: 'number' },
        ]}
        className={theme}
        sortable
        showRowNumbers
        style={{ height: 200 }}
      />
    </>
  );
}
