import { createContext, useContext } from 'react';

export type Lang = 'ja' | 'en';

/** 日英の対を持つ文字列。サンプルの meta や UI 文言はこの形で持つ */
export type Text = { ja: string; en: string };

export const LANGS: { key: Lang; label: string }[] = [
  { key: 'ja', label: '日本語' },
  { key: 'en', label: 'English' },
];

export const isLang = (v: string): v is Lang => v === 'ja' || v === 'en';

/** URL に言語がないときの初期値。日本語圏のブラウザだけ日本語にする */
export const detectLang = (): Lang =>
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ja')
    ? 'ja'
    : 'en';

export const LangContext = createContext<Lang>('ja');

export const useLang = () => useContext(LangContext);

/** サンプル内の文言を言語で切り替える。`const t = useText(TEXT);` の形で使う */
export const useText = <T,>(dict: Record<Lang, T>): T => dict[useContext(LangContext)];

export const UI: Record<Lang, Record<string, string>> = {
  ja: {
    groupGuide: '使い方',
    groupUsecase: 'ユースケース',
    groupApi: 'API',
    navLabel: 'サンプル一覧',
    docsPrefix: 'README',
    docsSuffix: 'を読む',
    lines: '行',
    copy: 'コピー',
    copied: 'コピーしました',
    stackblitz: 'StackBlitz で開く',
    expand: '全体を表示',
    collapse: '折りたたむ',
    titleSuffix: 'MasumeGrid デモ',
  },
  en: {
    groupGuide: 'Guide',
    groupUsecase: 'Use cases',
    groupApi: 'API',
    navLabel: 'Samples',
    docsPrefix: 'Read',
    docsSuffix: 'in the README',
    lines: 'lines',
    copy: 'Copy',
    copied: 'Copied',
    stackblitz: 'Open in StackBlitz',
    expand: 'Show all',
    collapse: 'Collapse',
    titleSuffix: 'MasumeGrid demo',
  },
};
