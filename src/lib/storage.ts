import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2AccountId, getR2AccessKeyId, getR2SecretAccessKey, getR2Bucket } from "./env";

function getS3Client(): S3Client {
	const accountId = getR2AccountId();
	return new S3Client({
		region: "auto",
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: getR2AccessKeyId(),
			secretAccessKey: getR2SecretAccessKey(),
		},
	});
}

export async function generateSignedDownloadUrl(
	storageKey: string,
	expirySeconds = 3600,
): Promise<string> {
	const client = getS3Client();
	const command = new GetObjectCommand({
		Bucket: getR2Bucket(),
		Key: storageKey,
	});
	return getSignedUrl(client, command, { expiresIn: expirySeconds });
}

export async function uploadToR2(
	storageKey: string,
	body: Buffer | Uint8Array,
	contentType: string,
): Promise<void> {
	const client = getS3Client();
	await client.send(
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: storageKey,
			Body: body,
			ContentType: contentType,
		}),
	);
}
