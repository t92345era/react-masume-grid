import { UI, useLang } from '../i18n';
import { docsUrl, type Example } from '../registry';
import CodeBlock from './CodeBlock';

export default function SamplePane({ example }: { example: Example }) {
  const lang = useLang();
  const ui = UI[lang];
  const { meta, Component, source } = example;
  const heading = meta.docs?.[lang];

  return (
    <article className="pane">
      <h1 className="pane-title">{meta.title[lang]}</h1>
      <p className="pane-desc">{meta.description[lang]}</p>
      {heading && (
        <p className="pane-docs">
          <a href={docsUrl(heading, lang)} target="_blank" rel="noreferrer">
            {lang === 'ja'
              ? `${ui.docsPrefix}「${heading}」${ui.docsSuffix} ↗`
              : `${ui.docsPrefix} “${heading}” ${ui.docsSuffix} ↗`}
          </a>
        </p>
      )}
      <div className="pane-demo">
        <Component />
      </div>
      <CodeBlock code={source} title={meta.title[lang]} />
    </article>
  );
}
