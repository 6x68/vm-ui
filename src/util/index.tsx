import { h, m } from "@violentmonkey/dom";
import baseCss from "./base.css";
import themes, { stylesheet as themeCss } from "./theme.module.css";

export { themes, themeCss };
export * from "./movable";

export interface IHostElementResult {
	id?: string;
	tag: string;
	shadow: boolean;
	host: HTMLElement;
	root: HTMLElement;
	addStyle: (css: string) => void;
	show: () => void;
	hide: () => void;
	dispose: () => void;
}

export function getHostElement(shadow = true): IHostElementResult {
	const id = getUniqueId("vmui-");
	const host = m(h(id, { id })) as HTMLElement;
	let root: HTMLElement;
	if (shadow) {
		// https://github.com/crackbob/ballcrack/blob/b5483be1e66c53be769bdf074cc07bace8a07b97/src/shadowWrapper.js#L6-L20
		const iframe = document.createElement("iframe");
		document.body.appendChild(iframe);

		const attachShadow = (
			iframe.contentWindow as Window & {
				Element: Element & { prototype: Element };
			}
		).Element.prototype.attachShadow;
		iframe.remove();

		const holder = document.createElement("div");
		root = attachShadow.apply(holder, [{ mode: "open" }]);
		document.body.appendChild(holder);
		root.appendChild(host);
	} else {
		root = m(h(id, { id })) as HTMLElement;
	}
	const styles: HTMLStyleElement[] = [];
	const addStyle = (css: string) => {
		if (!shadow && typeof GM_addStyle === "function") {
			styles.push(GM_addStyle(css.replace(/:host\b/g, `#${id} `)));
		} else {
			root.append(m(<style>{css}</style>));
		}
	};
	const dispose = () => {
		root.parentNode.removeChild(root);
		styles.forEach((style) => {
			style.remove();
		});
	};
	addStyle(baseCss);
	const result: IHostElementResult = {
		id,
		tag: "VM.getHostElement",
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

export function getUniqueId(prefix = "") {
	return prefix + Math.random().toString(36).slice(2, 8);
}

export function classNames(names: string[]) {
	return names.filter(Boolean).join(" ");
}
