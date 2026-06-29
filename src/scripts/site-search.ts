import gsap from "gsap";

type SearchHit = { title: string; href: string; excerpt: string; typeLabel: string };

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let abort: AbortController | undefined;
let uiBound = false;
let searchTween: gsap.core.Tween | null = null;

function getSiteSearchEls() {
	const modal = document.getElementById("siteSearchModal");
	const input = document.getElementById("siteSearchInput") as HTMLInputElement | null;
	const resultsEl = document.getElementById("siteSearchResults");
	const statusEl = document.getElementById("siteSearchStatus");
	const panel = modal?.querySelector<HTMLElement>("[data-site-search-panel]");
	const backdrop = modal?.querySelector<HTMLElement>("[data-site-search-backdrop]");
	if (!modal || !input || !resultsEl || !statusEl || !panel || !backdrop) return null;
	return { modal, input, resultsEl, statusEl, panel, backdrop };
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function animateSearch(open: boolean, onComplete?: () => void): void {
	const current = getSiteSearchEls();
	if (!current) return;
	const { modal, panel, backdrop } = current;
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	searchTween?.kill();
	searchTween = null;

	if (reduceMotion) {
		gsap.set(modal, { opacity: open ? 1 : 0 });
		gsap.set(backdrop, { opacity: open ? 1 : 0 });
		gsap.set(panel, { opacity: open ? 1 : 0, y: 0, scale: 1 });
		onComplete?.();
		return;
	}

	if (open) {
		gsap.set(modal, { opacity: 1 });
		searchTween = gsap
			.timeline({ onComplete })
			.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" }, 0)
			.fromTo(
				panel,
				{ opacity: 0, y: 18, scale: 0.97 },
				{ opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power3.out" },
				0.04,
			);
		return;
	}

	searchTween = gsap
		.timeline({ onComplete })
		.to(panel, { opacity: 0, y: 12, scale: 0.98, duration: 0.22, ease: "power2.in" }, 0)
		.to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.in" }, 0.02)
		.to(modal, { opacity: 0, duration: 0.01 }, 0.2);
}

export function closeSiteSearch(): void {
	const current = getSiteSearchEls();
	if (!current) return;
	const { modal, input, resultsEl } = current;
	if (!modal.classList.contains("is-open")) return;

	modal.classList.remove("is-open");
	modal.setAttribute("aria-hidden", "true");
	modal.inert = true;
	document.body.classList.remove("search-open");

	animateSearch(false, () => {
		modal.classList.add("invisible", "pointer-events-none");
		input.value = "";
		resultsEl.innerHTML = "";
		current.statusEl.textContent = "Type at least 2 characters";
	});

	abort?.abort();
}

export function openSiteSearch(): void {
	const current = getSiteSearchEls();
	if (!current) return;
	const { modal, input } = current;
	if (modal.classList.contains("is-open")) return;

	document.body.classList.remove("nav-open");
	document.getElementById("drawerBtn")?.setAttribute("aria-expanded", "false");

	modal.inert = false;
	modal.classList.remove("invisible", "pointer-events-none");
	modal.classList.add("is-open");
	modal.setAttribute("aria-hidden", "false");
	document.body.classList.add("search-open");

	animateSearch(true, () => {
		input.focus({ preventScroll: true });
	});
}

function renderResults(results: SearchHit[]): void {
	const current = getSiteSearchEls();
	if (!current) return;
	const { resultsEl } = current;
	resultsEl.innerHTML = "";
	if (results.length === 0) {
		current.statusEl.textContent = "No results";
		return;
	}
	current.statusEl.textContent = `${results.length} result${results.length === 1 ? "" : "s"}`;
	for (const item of results) {
		const li = document.createElement("li");
		li.className = "site-search-modal__result";
		const a = document.createElement("a");
		a.href = item.href;
		a.className = "site-search-modal__result-link";
		a.innerHTML = `<span class="site-search-modal__result-title">${escapeHtml(item.title)}</span><span class="site-search-modal__result-excerpt">${escapeHtml(item.excerpt)}</span><span class="site-search-modal__result-type">${escapeHtml(item.typeLabel)}</span>`;
		a.addEventListener("click", closeSiteSearch);
		li.appendChild(a);
		resultsEl.appendChild(li);
	}
}

async function runSearch(q: string): Promise<void> {
	const current = getSiteSearchEls();
	if (!current) return;
	abort?.abort();
	if (q.length < 2) {
		current.resultsEl.innerHTML = "";
		current.statusEl.textContent = "Type at least 2 characters";
		return;
	}
	current.statusEl.textContent = "Searching…";
	abort = new AbortController();
	try {
		const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abort.signal });
		const data = (await res.json()) as { results?: SearchHit[]; error?: string };
		if (!res.ok) {
			const live = getSiteSearchEls();
			if (live) {
				live.statusEl.textContent = data.error ?? "Search failed";
				live.resultsEl.innerHTML = "";
			}
			return;
		}
		renderResults(data.results ?? []);
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") return;
		const live = getSiteSearchEls();
		if (live) {
			live.statusEl.textContent = "Search unavailable";
			live.resultsEl.innerHTML = "";
		}
	}
}

function scheduleSearch(): void {
	const current = getSiteSearchEls();
	if (!current) return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => runSearch(current.input.value.trim()), 220);
}

function bindInputListener(): void {
	const input = getSiteSearchEls()?.input;
	if (!input || input.dataset.searchInputBound === "1") return;
	input.dataset.searchInputBound = "1";
	input.addEventListener("input", scheduleSearch);
}

function bindUiOnce(): void {
	if (uiBound) return;
	uiBound = true;

	document.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		if (target.closest("[data-site-search-open]")) {
			e.preventDefault();
			openSiteSearch();
			return;
		}
		if (target.closest("[data-site-search-close]") || target.closest("[data-site-search-backdrop]")) {
			if (getSiteSearchEls()?.modal.classList.contains("is-open")) closeSiteSearch();
		}
	});

	window.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
			e.preventDefault();
			if (getSiteSearchEls()?.modal.classList.contains("is-open")) closeSiteSearch();
			else openSiteSearch();
			return;
		}
		if (e.key === "Escape" && getSiteSearchEls()?.modal.classList.contains("is-open")) {
			e.preventDefault();
			closeSiteSearch();
		}
	});
}

/** Call on every page load / navigation so search works after DOM swaps. */
export function initSiteSearch(): void {
	bindUiOnce();
	bindInputListener();

	const current = getSiteSearchEls();
	if (!current) return;
	const { modal, panel, backdrop } = current;
	modal.classList.remove("is-open");
	modal.classList.add("invisible", "pointer-events-none");
	modal.setAttribute("aria-hidden", "true");
	modal.inert = true;
	gsap.set(modal, { opacity: 0 });
	gsap.set(backdrop, { opacity: 0 });
	gsap.set(panel, { opacity: 0, y: 12, scale: 0.98 });
}
