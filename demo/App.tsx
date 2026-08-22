import { useEffect, useState } from 'react';
import './demo.css';
import pkg from '../package.json';
import { examples, findExample, routeOf } from './registry';
import Sidebar from './components/Sidebar';
import SamplePane from './components/SamplePane';

const DEFAULT_ROUTE = routeOf(examples[0]);

// ハッシュルーティング: GitHub Pages 側の設定が要らず、記事から個別のサンプルへ
// 直接リンクできる
const readRoute = () => window.location.hash.replace(/^#\/?/, '') || DEFAULT_ROUTE;

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
      setNavOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const example = findExample(route) ?? examples[0];

  useEffect(() => {
    document.title = `${example.meta.title} — MasumeGrid デモ`;
  }, [example]);

  return (
    <div className="app">
      <header className="app-head">
        <button
          type="button"
          className="app-burger"
          aria-label="サンプル一覧"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>
        <a className="app-brand" href="#/">
          MasumeGrid
          <span className="app-version">v{pkg.version}</span>
        </a>
        <nav className="app-links">
          <a href="https://www.npmjs.com/package/react-masume-grid" target="_blank" rel="noreferrer">
            npm
          </a>
          <a href="https://github.com/t92345era/react-masume-grid" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>
      <div className="app-body">
        <Sidebar route={routeOf(example)} open={navOpen} onNavigate={() => setNavOpen(false)} />
        <main className="app-main">
          <SamplePane key={routeOf(example)} example={example} />
        </main>
      </div>
    </div>
  );
}
