import type { ComponentType } from 'react';
import type { Lang, Text } from './i18n';

export type Group = 'guide' | 'usecase' | 'api';

/** 各サンプルが `meta` という名前でエクスポートする情報 */
export type ExampleMeta = {
  title: Text;
  description: Text;
  /** グループ内の並び順（小さいほど上） */
  order?: number;
  /** README の見出し（言語ごと）。指定すると解説へのリンクが出る */
  docs?: Text;
};

export type Example = {
  id: string;
  group: Group;
  meta: ExampleMeta;
  Component: ComponentType;
  /** 画面に表示するソース。サンプル自身のファイルの中身 */
  source: string;
};

export const GROUPS: { key: Group; uiKey: string }[] = [
  { key: 'guide', uiKey: 'groupGuide' },
  { key: 'usecase', uiKey: 'groupUsecase' },
  { key: 'api', uiKey: 'groupApi' },
];

const REPO = 'https://github.com/t92345era/react-masume-grid/blob/main';

/** README の見出しから、その節へのリンクを組み立てる */
export function docsUrl(heading: string, lang: Lang): string {
  if (lang === 'ja') return `${REPO}/README.ja.md#${encodeURIComponent(heading)}`;
  // GitHub の見出しアンカーは、小文字化して記号を落とし、空白をハイフンにしたもの
  const slug = heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${REPO}/README.md#${slug}`;
}

// examples/<group>/<id>.tsx を置くだけで登録される。両方の glob が同じパスを
// キーにするので、コンポーネントとそのソースが取り違えられることはない
const modules = import.meta.glob<{ default: ComponentType; meta: ExampleMeta }>(
  './examples/*/*.tsx',
  { eager: true },
);
const sources = import.meta.glob<string>('./examples/*/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// 表示するのはサンプルのソースそのもの。ただしレジストリ用の meta と、
// リポジトリ内を指す import は利用者のコードには現れないので書き換える
function forDisplay(source: string): string {
  return source
    .replace(/^import type \{ ExampleMeta \}.*\n/m, '')
    .replace(/^export const meta: ExampleMeta = \{[\s\S]*?^\};\n\n?/m, '')
    .replace(/'\.\.\/\.\.\/\.\.\/src'/g, "'react-masume-grid'")
    .replace(
      /^(import \{[^}]*\} from 'react-masume-grid';)$/m,
      "$1\nimport 'react-masume-grid/styles.css';",
    )
    .trim();
}

const groupIndex = (g: Group) => GROUPS.findIndex((x) => x.key === g);

export const examples: Example[] = Object.entries(modules)
  .map(([path, mod]) => {
    const [, group, id] = /\.\/examples\/([^/]+)\/(.+)\.tsx$/.exec(path)!;
    return {
      id,
      group: group as Group,
      meta: mod.meta,
      Component: mod.default,
      source: forDisplay(sources[path]),
    };
  })
  .sort(
    (a, b) =>
      groupIndex(a.group) - groupIndex(b.group) ||
      (a.meta.order ?? 999) - (b.meta.order ?? 999) ||
      a.meta.title.ja.localeCompare(b.meta.title.ja, 'ja'),
  );

export const routeOf = (e: Example) => `${e.group}/${e.id}`;

export const findExample = (route: string) => examples.find((e) => routeOf(e) === route);
