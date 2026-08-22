import { UI, type Lang } from '../i18n';
import { GROUPS, examples, routeOf } from '../registry';

type Props = { lang: Lang; route: string; open: boolean; onNavigate: () => void };

export default function Sidebar({ lang, route, open, onNavigate }: Props) {
  const ui = UI[lang];
  return (
    <nav className={'nav' + (open ? ' nav--open' : '')} aria-label={ui.navLabel}>
      {GROUPS.map((group) => {
        const items = examples.filter((e) => e.group === group.key);
        if (items.length === 0) return null;
        return (
          <div className="nav-group" key={group.key}>
            <h2 className="nav-title">{ui[group.uiKey]}</h2>
            <ul className="nav-list">
              {items.map((e) => {
                const to = routeOf(e);
                return (
                  <li key={to}>
                    <a
                      href={`#/${lang}/${to}`}
                      className={'nav-item' + (to === route ? ' nav-item--active' : '')}
                      aria-current={to === route ? 'page' : undefined}
                      onClick={onNavigate}
                    >
                      {e.meta.title[lang]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
