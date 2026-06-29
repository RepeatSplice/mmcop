import gsap from "gsap";

export function initNav(): void {
	initMobileDrawer();
	initDesktopNavMega();
}

function initMobileDrawer(): void {
	const body = document.body;
	const toggle = document.getElementById("drawerBtn");
	const backdrop = document.getElementById("drawerBackdrop");

	// Guard: only bind once per element instance (survives module caching)
	if (!toggle || toggle.dataset.navBound === "1") return;
	toggle.dataset.navBound = "1";

	function close(): void {
		body.classList.remove("nav-open");
		toggle!.setAttribute("aria-expanded", "false");
	}

	toggle.addEventListener("click", (e) => {
		// Prevent the click from bubbling to any document-level handlers
		e.stopPropagation();
		const isOpen = body.classList.contains("nav-open");
		body.classList.toggle("nav-open", !isOpen);
		toggle!.setAttribute("aria-expanded", String(!isOpen));
	});

	backdrop?.addEventListener("click", close);

	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") close();
	});

	window.addEventListener("resize", () => {
		if (window.matchMedia("(min-width: 1024px)").matches) close();
	});
}

function initDesktopNavMega(): void {
	const desktop = window.matchMedia("(min-width: 1024px)");
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const items = [...document.querySelectorAll<HTMLElement>("[data-nav-mega]")];
	if (!items.length) return;

	items.forEach((item) => {
		const panel = item.querySelector<HTMLElement>("[data-nav-mega-panel]");
		const links = [...item.querySelectorAll<HTMLElement>("[data-nav-mega-link]")];
		if (!panel) return;

		let closeTimer: ReturnType<typeof setTimeout> | undefined;
		let panelTween: gsap.core.Tween | null = null;
		let linksTween: gsap.core.Tween | null = null;

		function killTweens(): void {
			panelTween?.kill();
			linksTween?.kill();
			panelTween = null;
			linksTween = null;
		}

		function setClosedInstant(): void {
			killTweens();
			item.classList.remove("is-open");
			gsap.set(panel, {
				opacity: 0,
				y: 14,
				scale: 0.96,
				visibility: "hidden",
				pointerEvents: "none",
			});
			gsap.set(links, { opacity: 0, y: 8 });
		}

		function open(): void {
			if (!desktop.matches) return;
			clearTimeout(closeTimer);
			killTweens();
			item.classList.add("is-open");
			gsap.set(panel, { visibility: "visible", pointerEvents: "auto" });

			if (reduceMotion.matches) {
				gsap.set(panel, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
				gsap.set(links, { opacity: 1, y: 0, clearProps: "transform" });
				return;
			}

			panelTween = gsap.fromTo(
				panel,
				{ opacity: 0, y: 14, scale: 0.96 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.48,
					ease: "power3.out",
					overwrite: "auto",
				},
			);

			linksTween = gsap.fromTo(
				links,
				{ opacity: 0, y: 10 },
				{
					opacity: 1,
					y: 0,
					duration: 0.38,
					stagger: 0.045,
					ease: "power2.out",
					delay: 0.07,
					overwrite: "auto",
				},
			);
		}

		function scheduleClose(): void {
			if (!desktop.matches) return;
			clearTimeout(closeTimer);
			closeTimer = setTimeout(close, 140);
		}

		function close(): void {
			if (!desktop.matches) return;
			if (!item.classList.contains("is-open")) return;

			clearTimeout(closeTimer);
			killTweens();
			item.classList.remove("is-open");

			if (reduceMotion.matches) {
				setClosedInstant();
				return;
			}

			linksTween = gsap.to(links, {
				opacity: 0,
				y: 4,
				duration: 0.12,
				stagger: { each: 0.012, from: "end" },
				ease: "power2.in",
				overwrite: "auto",
			});

			panelTween = gsap.to(panel, {
				opacity: 0,
				y: 8,
				scale: 0.98,
				duration: 0.18,
				ease: "power2.in",
				overwrite: "auto",
				onComplete: () => {
					gsap.set(panel, { visibility: "hidden", pointerEvents: "none" });
				},
			});
		}

		setClosedInstant();

		item.addEventListener("mouseenter", open);
		item.addEventListener("mouseleave", scheduleClose);
		item.addEventListener("focusin", open);
		item.addEventListener("focusout", (e) => {
			const next = e.relatedTarget;
			if (next instanceof Node && item.contains(next)) return;
			scheduleClose();
		});

		desktop.addEventListener("change", () => {
			clearTimeout(closeTimer);
			setClosedInstant();
		});
	});
}
