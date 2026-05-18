export function initHome(): void {
	initNav();
	initHero();
	initNewsTabs();
	initNewsArchive();
}

function initNav(): void {
	const body = document.body;
	const toggle = document.getElementById("drawerBtn");
	const backdrop = document.getElementById("drawerBackdrop");

	function close(): void {
		body.classList.remove("nav-open");
		toggle?.setAttribute("aria-expanded", "false");
	}

	toggle?.addEventListener("click", () => {
		const open = !body.classList.contains("nav-open");
		body.classList.toggle("nav-open", open);
		toggle.setAttribute("aria-expanded", String(open));
	});

	backdrop?.addEventListener("click", close);

	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") close();
	});

	window.addEventListener("resize", () => {
		if (window.matchMedia("(min-width: 1024px)").matches) close();
	});
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
		slides.forEach((el, j) => el.classList.toggle("is-active", j === index));
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

function initNewsTabs(): void {
	const tabs = document.querySelectorAll<HTMLButtonElement>("[data-news-tab]");
	const panels = document.querySelectorAll<HTMLElement>("[data-news-panel]");
	if (!tabs.length) return;

	tabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			const id = tab.dataset.newsTab;
			tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
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
