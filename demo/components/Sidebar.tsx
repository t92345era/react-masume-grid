import { GROUPS, examples, routeOf } from '../registry';

type Props = { route: string; open: boolean; onNavigate: () => void };

export default function Sidebar({ route, open, onNavigate }: Props) {
  return (
    <nav className={'nav' + (open ? ' nav--open' : '')} aria-label="サンプル一覧">
      {GROUPS.map((group) => {
        const items = examples.filter((e) => e.group === group.key);
        if (items.length === 0) return null;
        return (
          <div className="nav-group" key={group.key}>
            <h2 className="nav-title">{group.label}</h2>
            <ul className="nav-list">
              {items.map((e) => {
                const to = routeOf(e);
                return (
                  <li key={to}>
                    <a
                      href={`#/${to}`}
                      className={'nav-item' + (to === route ? ' nav-item--active' : '')}
                      aria-current={to === route ? 'page' : undefined}
                      onClick={onNavigate}
                    >
                      {e.meta.title}
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
