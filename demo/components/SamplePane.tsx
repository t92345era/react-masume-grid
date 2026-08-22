import { DOCS_BASE, type Example } from '../registry';
import CodeBlock from './CodeBlock';

export default function SamplePane({ example }: { example: Example }) {
  const { meta, Component, source } = example;
  return (
    <article className="pane">
      <h1 className="pane-title">{meta.title}</h1>
      <p className="pane-desc">{meta.description}</p>
      {meta.docs && (
        <p className="pane-docs">
          <a href={DOCS_BASE + encodeURIComponent(meta.docs)} target="_blank" rel="noreferrer">
            README「{meta.docs}」を読む ↗
          </a>
        </p>
      )}
      <div className="pane-demo">
        <Component />
      </div>
      <CodeBlock code={source} />
    </article>
  );
}
