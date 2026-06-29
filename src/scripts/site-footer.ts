import gsap from "gsap";

let footerBound = false;

export function initFooter(): void {
	if (footerBound) return;
	footerBound = true;
	initFooterMarquee();
}

function initFooterMarquee(): void {
	const root = document.querySelector<HTMLElement>("[data-footer-marquee]");
	const track = root?.querySelector<HTMLElement>("[data-footer-marquee-track]");
	const template = track?.querySelector<HTMLElement>("[data-footer-marquee-set]");
	if (!root || !track || !template) return;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	let tween: gsap.core.Tween | null = null;
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;

	function onEnter(): void {
		tween?.pause();
	}

	function onLeave(): void {
		tween?.resume();
	}

	function measureSetWidth(set: HTMLElement): number {
		return set.getBoundingClientRect().width;
	}

	function ensureSets(): HTMLElement {
		const sets = track.querySelectorAll<HTMLElement>("[data-footer-marquee-set]");
		sets.forEach((set, index) => {
			if (index > 0) set.remove();
		});

		const base = track.querySelector<HTMLElement>("[data-footer-marquee-set]");
		if (!base) return template;

		const minTrackWidth = window.innerWidth * 2.5;
		let clone = base.cloneNode(true) as HTMLElement;
		clone.setAttribute("aria-hidden", "true");
		track.appendChild(clone);

		while (track.scrollWidth < minTrackWidth) {
			clone = base.cloneNode(true) as HTMLElement;
			clone.setAttribute("aria-hidden", "true");
			track.appendChild(clone);
		}

		return base;
	}

	function start(): void {
		tween?.kill();
		tween = null;
		root.removeEventListener("mouseenter", onEnter);
		root.removeEventListener("mouseleave", onLeave);

		gsap.set(track, { clearProps: "transform" });
		gsap.set(track, { x: 0 });

		const baseSet = ensureSets();
		const setWidth = measureSetWidth(baseSet);
		if (setWidth <= 0) return;

		if (reduceMotion.matches) return;

		const pxPerSecond = 42;
		const duration = Math.max(28, setWidth / pxPerSecond);

		tween = gsap.to(track, {
			x: -setWidth,
			duration,
			ease: "none",
			repeat: -1,
		});

		root.addEventListener("mouseenter", onEnter);
		root.addEventListener("mouseleave", onLeave);
	}

	function scheduleStart(): void {
		requestAnimationFrame(() => {
			requestAnimationFrame(start);
		});
	}

	scheduleStart();

	document.fonts?.ready.then(() => scheduleStart()).catch(() => {});

	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(scheduleStart, 120);
	});

	reduceMotion.addEventListener("change", scheduleStart);
}
