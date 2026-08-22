// サンプルをそのまま動く Vite + React プロジェクトとして StackBlitz で開く。
// SDK は使わず、POST フォームでプロジェクト一式を送る（依存を増やさないため）。

const INDEX_HTML = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>MasumeGrid example</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-masume-grid/styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
`;

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src'],
  },
  null,
  2,
);

const PACKAGE_JSON = JSON.stringify(
  {
    name: 'masume-grid-example',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: {
      react: '^19.1.0',
      'react-dom': '^19.1.0',
      'react-masume-grid': 'latest',
    },
    devDependencies: {
      '@types/react': '^19.1.0',
      '@types/react-dom': '^19.1.0',
      '@vitejs/plugin-react': '^4.5.0',
      typescript: '^5.8.3',
      vite: '^6.3.5',
    },
  },
  null,
  2,
);

export function openInStackBlitz(code: string, title: string) {
  const files: Record<string, string> = {
    'index.html': INDEX_HTML,
    'package.json': PACKAGE_JSON,
    'tsconfig.json': TSCONFIG,
    'vite.config.ts': VITE_CONFIG,
    'src/main.tsx': MAIN_TSX,
    'src/App.tsx': code,
  };

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://stackblitz.com/run?file=src%2FApp.tsx';
  form.target = '_blank';

  const add = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  add('project[title]', `MasumeGrid — ${title}`);
  add('project[description]', 'https://t92345era.github.io/react-masume-grid/');
  add('project[template]', 'node');
  for (const [path, contents] of Object.entries(files)) add(`project[files][${path}]`, contents);

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
