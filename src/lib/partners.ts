export interface Partner {
	name: string;
	href: string | null;
	logo: string;
	/** Visual scale inside the tile (default 1) */
	logoScale?: number;
}

export const partners: Partner[] = [
	{ name: "Operation Monarch", href: "https://play-opm.com", logo: "/Operation%20Monarch%20Logo.png", logoScale: 1 },
	{ name: "Vyse", href: "https://vyse.pb.gallery", logo: "/Vyse%20Logo%20%5BVectorized%5D.png", logoScale: 1.25 },
	{ name: "Monarch Modding", href: "https://monarch-modding.com", logo: "/Monarch%20Modding.png", logoScale: 0.85 },
	{ name: "VYKIX", href: "https://www.vykix.com", logo: "/VYKIX%20Logo%20%5BVectorized%5D.png", logoScale: 1 },
	{ name: "Lord of War", href: null, logo: "/Lord%20Of%20War%20Logo.png", logoScale: 1.1 },
	{ name: "OVO", href: "https://guns.lol/oveo", logo: "/OVO.png", logoScale: 1 },
];

/** Homepage partners strip: up to six logos in a 3×2 grid */
export const featuredPartners: Partner[] = partners.slice(0, 6);
