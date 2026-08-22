import type { ComponentType } from 'react';

export type Group = 'guide' | 'usecase' | 'api';

/** 各サンプルが `meta` という名前でエクスポートする情報 */
export type ExampleMeta = {
  title: string;
  description: string;
  /** グループ内の並び順（小さいほど上） */
  order?: number;
  /** README.ja.md の見出し。指定すると解説へのリンクが出る */
  docs?: string;
};

export type Example = {
  id: string;
  group: Group;
  meta: ExampleMeta;
  Component: ComponentType;
  /** 画面に表示するソース。サンプル自身のファイルの中身 */
  source: string;
};

export const GROUPS: { key: Group; label: string }[] = [
  { key: 'guide', label: '使い方' },
  { key: 'usecase', label: 'ユースケース' },
  { key: 'api', label: 'API' },
];

export const DOCS_BASE =
  'https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#';

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
      a.meta.title.localeCompare(b.meta.title, 'ja'),
  );

export const routeOf = (e: Example) => `${e.group}/${e.id}`;

export const findExample = (route: string) => examples.find((e) => routeOf(e) === route);
