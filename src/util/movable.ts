export interface MovableOrigin {
	x: "auto" | "start" | "end";
	y: "auto" | "start" | "end";
}

export interface MovableOptions {
	/**
	 * Where this panel will originate from.
	 * @default { x: "auto", y: "auto" }
	 */
	origin: MovableOrigin;
	/** A callback which is called on the `pointerDown` event */
	onMoved?: () => void;
	/**
	 * @param e the pointer event
	 * @returns If we should start dragging the object.
	 */
	canDrag?(e: PointerEvent): boolean;
	/**
	 * Threshold for actually moving the object, checks if `deltaX + deltaY < dragThreshold`
	 * @default 5
	 */
	dragThreshold?: number;
}

export class Movable {
	static defaultOptions: MovableOptions = {
		origin: { x: "auto", y: "auto" },
		dragThreshold: 5,
	};

	private pointerId: number | null = null;
	private startPos?: { x: number; y: number };
	private offset?: { x: number; y: number };
	private dragging = false;

	private options: MovableOptions;

	constructor(
		private el: HTMLElement,
		options?: Partial<MovableOptions>,
	) {
		this.setOptions(options);
		this.el.style.touchAction = "none";
	}

	/**
	 * Merges {@linkcode Movable.defaultOptions the default options} with {@linkcode options}.
	 * @param options additional options.
	 */
	setOptions(options: Partial<MovableOptions>) {
		this.options = {
			...Movable.defaultOptions,
			...options,
		};
	}

	private requirementsMet(e: PointerEvent): boolean {
		return this.options?.canDrag?.(e) ?? true;
	}

	private onPointerDown = (e: PointerEvent) => {
		if (!this.requirementsMet(e)) return;

		this.pointerId = e.pointerId;
		this.startPos = { x: e.clientX, y: e.clientY };

		document.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
		document.addEventListener("pointercancel", this.onPointerUp);
		this.options.onMoved?.();
	};

	private onPointerMove = (e: PointerEvent) => {
		if (e.pointerId !== this.pointerId || !this.startPos) return;

		const dx = e.clientX - this.startPos.x;
		const dy = e.clientY - this.startPos.y;

		if (!this.dragging) {
			if (Math.abs(dx) + Math.abs(dy) < this.options.dragThreshold) return;

			this.dragging = true;

			const rect = this.el.getBoundingClientRect();
			this.offset = {
				x: this.startPos.x - rect.left,
				y: this.startPos.y - rect.top,
			};

			this.el.setPointerCapture(e.pointerId);
		}

		e.preventDefault();

		if (!this.offset) return;

		this.el.style.left = `${e.clientX - this.offset.x}px`;
		this.el.style.top = `${e.clientY - this.offset.y}px`;
	};

	private onPointerUp = (e: PointerEvent) => {
		if (e.pointerId !== this.pointerId) return;

		if (this.dragging) {
			this.el.releasePointerCapture(e.pointerId);
		}

		this.cleanup();
	};

	enable() {
		this.el.addEventListener("pointerdown", this.onPointerDown);
	}

	cleanup() {
		document.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
		document.removeEventListener("pointercancel", this.onPointerUp);
	}

	disable() {
		this.dragging = undefined;
		this.el.removeEventListener("pointerdown", this.onPointerDown);
		document.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
	}
}
