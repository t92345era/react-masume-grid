import { useEffect, useState } from 'react';
import './demo.css';
import pkg from '../package.json';
import { LangContext, UI, detectLang, isLang, LANGS, type Lang } from './i18n';
import { examples, findExample, routeOf } from './registry';
import Sidebar from './components/Sidebar';
import SamplePane from './components/SamplePane';

const DEFAULT_ROUTE = routeOf(examples[0]);

/**
 * ハッシュルーティング: `#/<lang>/<group>/<id>`。GitHub Pages 側の設定が要らず、
 * 記事から特定の言語・特定のサンプルへ直接リンクできる。言語を省いた
 * `#/<group>/<id>` も、以前のリンクのために受け付ける。
 */
function readHash(): { lang: Lang | null; route: string } {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length > 0 && isLang(parts[0])) {
    return { lang: parts[0], route: parts.slice(1).join('/') || DEFAULT_ROUTE };
  }
  return { lang: null, route: parts.join('/') || DEFAULT_ROUTE };
}

export default function App() {
  const [{ lang, route }, setState] = useState(() => {
    const hash = readHash();
    return { lang: hash.lang ?? detectLang(), route: hash.route };
  });
  const [navOpen, setNavOpen] = useState(false);

  // 言語をURLに載せたままにする（共有されたリンクが同じ言語で開く）
  useEffect(() => {
    const wanted = `#/${lang}/${route}`;
    if (window.location.hash !== wanted) window.history.replaceState(null, '', wanted);
  }, [lang, route]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = readHash();
      setState((prev) => ({ lang: hash.lang ?? prev.lang, route: hash.route }));
      setNavOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const example = findExample(route) ?? examples[0];
  const ui = UI[lang];

  useEffect(() => {
    document.title = `${example.meta.title[lang]} — ${ui.titleSuffix}`;
  }, [example, lang, ui]);

  // サンプルは表示言語をここから読む。子より先に確定させたいので描画中に書く
  document.documentElement.lang = lang;

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <header className="app-head">
          <button
            type="button"
            className="app-burger"
            aria-label={ui.navLabel}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>
          <a className="app-brand" href={`#/${lang}/${DEFAULT_ROUTE}`}>
            MasumeGrid
            <span className="app-version">v{pkg.version}</span>
          </a>
          <div className="app-langs" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.key}
                type="button"
                className={'app-lang' + (l.key === lang ? ' app-lang--on' : '')}
                aria-pressed={l.key === lang}
                onClick={() => setState((prev) => ({ ...prev, lang: l.key }))}
              >
                {l.label}
              </button>
            ))}
          </div>
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
          <Sidebar
            lang={lang}
            route={routeOf(example)}
            open={navOpen}
            onNavigate={() => setNavOpen(false)}
          />
          <main className="app-main">
            <SamplePane key={routeOf(example) + lang} example={example} />
          </main>
        </div>
      </div>
    </LangContext.Provider>
  );
}
