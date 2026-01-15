import { m, h } from '@violentmonkey/dom';
import baseCss from './base.css';
import themes, { stylesheet as themeCss } from './theme.module.css';

export { themes, themeCss };
export * from './movable';

export interface IHostElementResult {
  id?: string;
  tag: string;
  shadow: boolean;
  host: HTMLElement;
  withRoot<T>(cb: (it: HTMLElement) => T): T;
  addStyle(css: string): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

type HostEntry = {
  root: HTMLElement;
  shadowRoot?: ShadowRoot;
};

export const host2ShadowMap = new WeakMap<HTMLElement, HostEntry>();

export function getHostElement(shadow = true): IHostElementResult {
  const id = getUniqueId('vmui-');
  const host = m(h(id, { id })) as HTMLElement;

  let root: HTMLElement;

  if (shadow) {
    const shadowRoot = host.attachShadow({ mode: 'open' });

    const el = document.createElement('div');
    el.id = id;
    shadowRoot.appendChild(el);

    root = el;
    host2ShadowMap.set(host, { root: el, shadowRoot });
  } else {
    root = m(h(id, { id })) as HTMLElement;
    host2ShadowMap.set(host, { root });
  }

  const styles: HTMLStyleElement[] = [];
  const addStyle = (css: string) => {
    const entry = host2ShadowMap.get(host);
    if (entry?.shadowRoot) {
      const styleEl = document.createElement('style');
      styleEl.textContent = css;
      entry.shadowRoot.appendChild(styleEl);
      styles.push(styleEl);
    } else if (!shadow && typeof GM_addStyle === 'function') {
      styles.push(GM_addStyle(css.replace(/:host\b/g, `#${id} `)));
    } else {
      const styleNode = m(<style>{css}</style>) as HTMLStyleElement;
      root.append(styleNode);
      styles.push(styleNode);
    }
  };

  const dispose = () => {
    root.remove();
    host.remove();
    styles.forEach((style) => style.remove());
    host2ShadowMap.delete(host);
  };

  addStyle(baseCss);

  const result: IHostElementResult = {
    id,
    tag: 'VM.getHostElement',
    shadow,
    host,
    withRoot(fn) {
      const entry = host2ShadowMap.get(this.host ?? host);
      return fn((entry && entry.root) ?? root);
    },
    addStyle,
    dispose,
    show() {
      appendToBody(this.tag, this.host);
    },
    hide() {
      this.host.remove();
    },
  };
  return result;
}

export function appendToBody(
  tag: string,
  ...children: (string | Node)[]
): void {
  if (!document.body) {
    console.warn(`[${tag}] document.body is not ready yet, operation skipped.`);
    return;
  }
  document.body.append(...children);
}

export function getUniqueId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export function classNames(names: string[]) {
  return names.filter(Boolean).join(' ');
}
