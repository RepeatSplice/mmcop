import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initNav } from "./site-nav";
import { initSiteSearch } from "./site-search";
import { initFooter } from "./site-footer";

export function initSiteChrome(): void {
	initNav();
	initSiteSearch();
	initFooter();
}

export function initHome(): void {
	initSiteChrome();
	initHero();
	initScenarioReveals();
	initNewsTabs();
	initNewsArchive();
}

function initHero(): void {
	const root = document.querySelector<HTMLElement>("[data-hero-carousel]");
	if (!root) return;

	const slides = [...root.querySelectorAll<HTMLElement>("[data-hero-slide]")];
	const dots = [...root.querySelectorAll<HTMLButtonElement>("[data-hero-dot]")];
	const prev = root.querySelector<HTMLButtonElement>("[data-hero-prev]");
	const next = root.querySelector<HTMLButtonElement>("[data-hero-next]");
	let index = 0;
	let timer: ReturnType<typeof setInterval> | undefined;

	const delay = Number(root.dataset.delay ?? 5000);

	function go(i: number): void {
		index = (i + slides.length) % slides.length;
		slides.forEach((el, j) => {
			const active = j === index;
			el.classList.toggle("is-active", active);
			el.setAttribute("aria-hidden", active ? "false" : "true");
		});
		dots.forEach((el, j) => {
			el.classList.toggle("is-active", j === index);
			el.setAttribute("aria-selected", j === index ? "true" : "false");
		});
	}

	function schedule(): void {
		if (timer) clearInterval(timer);
		if (delay > 0 && slides.length > 1) {
			timer = setInterval(() => go(index + 1), delay);
		}
	}

	prev?.addEventListener("click", () => {
		go(index - 1);
		schedule();
	});
	next?.addEventListener("click", () => {
		go(index + 1);
		schedule();
	});
	dots.forEach((dot, j) => {
		dot.addEventListener("click", () => {
			go(j);
			schedule();
		});
	});

	go(0);
	schedule();
}

let scenarioRevealTriggers: ScrollTrigger[] = [];

function revealScrollTargetsInView(targets: HTMLElement[], startRatio: number): void {
	const line = window.innerHeight * startRatio;
	targets.forEach((el) => {
		if (el.getBoundingClientRect().top < line) {
			gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
		}
	});
}

function initScenarioReveals(): void {
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const targets = [...document.querySelectorAll<HTMLElement>("[data-scroll-reveal] .st-reveal")];
	if (!targets.length) return;

	scenarioRevealTriggers.forEach((st) => st.kill());
	scenarioRevealTriggers = [];
	document.documentElement.classList.remove("scroll-reveal-ready");

	if (reduceMotion.matches) {
		gsap.set(targets, { opacity: 1, y: 0, clearProps: "transform" });
		return;
	}

	gsap.registerPlugin(ScrollTrigger);

	const wide = window.matchMedia("(min-width: 768px)").matches;
	const yOff = wide ? 10 : 6;
	const startRatio = wide ? 0.9 : 0.93;

	document.documentElement.classList.add("scroll-reveal-ready");
	gsap.set(targets, { opacity: 0, y: yOff });

	scenarioRevealTriggers = ScrollTrigger.batch(targets, {
		start: wide ? "top 90%" : "top 93%",
		once: true,
		onEnter: (batch) => {
			gsap.to(batch, {
				opacity: 1,
				y: 0,
				duration: wide ? 0.85 : 0.75,
				ease: "power1.out",
				stagger: 0.08,
				overwrite: "auto",
			});
		},
	});

	const refreshReveals = (): void => {
		ScrollTrigger.refresh();
		revealScrollTargetsInView(targets, startRatio);
	};

	requestAnimationFrame(() => {
		requestAnimationFrame(refreshReveals);
	});

	if (document.readyState === "complete") {
		refreshReveals();
	} else {
		window.addEventListener("load", refreshReveals, { once: true });
	}
}

function initNewsTabs(): void {
	const tabs = document.querySelectorAll<HTMLButtonElement>("[data-news-tab]");
	const panels = document.querySelectorAll<HTMLElement>("[data-news-panel]");
	if (!tabs.length) return;

	tabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			const id = tab.dataset.newsTab;
			tabs.forEach((t) => {
				const active = t === tab;
				t.classList.toggle("is-active", active);
				t.setAttribute("aria-selected", active ? "true" : "false");
			});
			panels.forEach((p) => {
				p.classList.toggle("is-active", p.dataset.newsPanel === id);
			});
		});
	});
}

function initNewsArchive(): void {
	const buttons = document.querySelectorAll<HTMLButtonElement>("[data-news-filter]");
	if (!buttons.length) return;

	const rows = document.querySelectorAll<HTMLElement>("[data-news-row]");
	const empty = document.querySelector<HTMLElement>("[data-news-empty]");
	const countEl = document.querySelector<HTMLElement>("[data-news-count]");
	const total = rows.length;

	function apply(filter: string): void {
		let visible = 0;
		rows.forEach((row) => {
			const cat = row.dataset.newsCategory ?? "";
			const show = filter === "all" || cat === filter;
			row.classList.toggle("is-hidden", !show);
			if (show) visible += 1;
		});
		empty?.classList.toggle("is-hidden", visible !== 0);
		if (countEl) countEl.textContent = String(visible);
	}

	buttons.forEach((btn) => {
		btn.addEventListener("click", () => {
			const filter = btn.dataset.newsFilter ?? "all";
			buttons.forEach((b) => {
				const active = b === btn;
				b.classList.toggle("is-active", active);
				b.setAttribute("aria-selected", active ? "true" : "false");
			});
			apply(filter);
		});
	});

	if (countEl && total) countEl.textContent = String(total);
}
