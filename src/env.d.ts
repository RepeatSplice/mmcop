/// <reference path="../.astro/types.d.ts" />

import type { Customer } from "@prisma/client";

type StaffSession = {
	id: string;
	email: string;
	name: string;
	role: "ADMIN" | "EDITOR" | "SHOP_MANAGER";
	totpEnabled: boolean;
};

declare namespace App {
	interface Locals {
		staff?: StaffSession;
		customer?: Customer;
	}
}
