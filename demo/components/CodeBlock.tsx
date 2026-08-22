import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { openInStackBlitz } from './stackblitz';

/** これを超える行数のサンプルは折りたたんで表示する */
const COLLAPSE_OVER = 28;

export default function CodeBlock({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lines = code.split('\n').length;
  const collapsed = lines > COLLAPSE_OVER && !expanded;

  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <section className="code">
      <div className="code-bar">
        <span className="code-lang">tsx</span>
        <span className="code-lines">{lines} 行</span>
        <button type="button" className="code-copy" onClick={copy}>
          {copied ? 'コピーしました' : 'コピー'}
        </button>
        <button
          type="button"
          className="code-copy"
          onClick={() => openInStackBlitz(code, title)}
        >
          StackBlitz で開く ↗
        </button>
      </div>
      <div className={'code-body' + (collapsed ? ' code-body--collapsed' : '')}>
        <Highlight code={code} language="tsx" theme={themes.github}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => (
                <span key={i} {...getLineProps({ line })} className="code-line">
                  <span className="code-lineno">{i + 1}</span>
                  <span>
                    {line.map((token, k) => (
                      <span key={k} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </span>
              ))}
            </pre>
          )}
        </Highlight>
        {collapsed && <div className="code-fade" />}
      </div>
      {lines > COLLAPSE_OVER && (
        <button type="button" className="code-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '折りたたむ' : `全体を表示（${lines} 行）`}
        </button>
      )}
    </section>
  );
}
