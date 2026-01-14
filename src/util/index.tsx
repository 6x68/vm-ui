import { m, h } from '@violentmonkey/dom';
import baseCss from './base.css';
import themes, { stylesheet as themeCss } from './theme.module.css';

export { themes, themeCss };
export * from './movable';

export interface IHostElementResult {
  tag: string;
  shadow: boolean;
  host: HTMLElement;
  root: ShadowRoot | HTMLElement;
  addStyle: (css: string) => void;
  show: () => void;
  hide: () => void;
  dispose: () => void;
}

type Yes = HTMLIFrameElement & Window & { Element: Element & { prototype: Element; } };

export function getHostElement(shadow = true): IHostElementResult {
  const id: string | undefined = shadow ? undefined : getUniqueId('vmui-');
  let host: HTMLElement;
  let root: ShadowRoot | HTMLElement;
  if (shadow) {
    // https://github.com/crackbob/ballcrack/blob/b5483be1e66c53be769bdf074cc07bace8a07b97/src/shadowWrapper.js#L6-L20
    const iframe = document.createElement('iframe') as unknown as Yes;
    document.body.appendChild(iframe);

    const attachShadow = iframe.Element.prototype.attachShadow;
    iframe.remove();

    host = document.createElement('div');
    root = attachShadow.apply(host, [{ mode: 'closed' }]);

    const hostEl = document.createElement('div');
    host.appendChild(hostEl);
  } else {
    root = m(h(id, { id })) as HTMLElement;
    root.append(root);
  }
  const styles: HTMLStyleElement[] = [];
  const addStyle = (css: string) => {
    if (!shadow && typeof GM_addStyle === 'function') {
      styles.push(GM_addStyle(css.replace(/:host\b/g, `#${id} `)));
    } else {
      root.append(m(<style>{css}</style>));
    }
  };
  const dispose = () => {
    host.remove();
    styles.forEach((style) => style.remove());
  };
  addStyle(baseCss);
  const result: IHostElementResult = {
    tag: 'VM.getHostElement',
    shadow,
    host,
    root,
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
