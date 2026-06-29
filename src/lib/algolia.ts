import { algoliasearch } from "algoliasearch";
import { getAlgoliaAppId, getAlgoliaSearchKey, getAlgoliaAdminKey } from "./env";

export const SEARCH_INDEX = "monarch";

export type AlgoliaRecord = {
	objectID: string;
	title: string;
	excerpt: string;
	href: string;
	type: "page" | "product" | "news" | "job";
	typeLabel: string;
};

export function getSearchClient() {
	return algoliasearch(getAlgoliaAppId(), getAlgoliaSearchKey());
}

export function getAdminClient() {
	const adminKey = getAlgoliaAdminKey();
	if (!adminKey) throw new Error("ALGOLIA_ADMIN_KEY is not set");
	return algoliasearch(getAlgoliaAppId(), adminKey);
}

/** Save or update a single record in the index. Used by manage hooks. */
export async function reindexRecord(record: AlgoliaRecord): Promise<void> {
	const client = getAdminClient();
	await client.saveObject({ indexName: SEARCH_INDEX, body: record });
}

/** Remove a record from the index (e.g. when a post is archived/deleted). */
export async function removeFromIndex(objectID: string): Promise<void> {
	const client = getAdminClient();
	await client.deleteObject({ indexName: SEARCH_INDEX, objectID });
}
