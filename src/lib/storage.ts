import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
    endpoint?: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
}

export function getS3Client(config: S3Config) {
    return new S3Client({
        region: config.region,
        endpoint: config.endpoint || undefined,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    });
}

export async function generateUploadUrl(config: S3Config, key: string, contentType: string = "video/mp4") {
    try {
        const client = getS3Client(config);
        const command = new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            ContentType: contentType
        });

        // Generate Presigned URL (valid for 1 hour)
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        return url;
    } catch (e) {
        console.error("Presign Error:", e);
        return null;
    }
}

export interface StoredFile {
    key: string;
    lastModified: Date | undefined;
    size: number | undefined;
    url: string; // Public URL (assuming public bucket or presigned get)
}

export async function listFiles(config: S3Config, prefix: string = ""): Promise<StoredFile[]> {
    try {
        const client = getS3Client(config);
        const command = new ListObjectsV2Command({
            Bucket: config.bucket,
            Prefix: prefix
        });

        const res = await client.send(command);

        if (!res.Contents) return [];

        const storedFiles = await Promise.all(res.Contents.map(async (item) => {
            const getCommand = new GetObjectCommand({
                Bucket: config.bucket,
                Key: item.Key
            });

            let url = "";
            try {
                url = await getSignedUrl(client, getCommand, { expiresIn: 3600 });
            } catch (e) {
                console.error("Failed to sign url for key", item.Key);
                // Fallback to public
                if (config.endpoint) {
                    url = `${config.endpoint}/${config.bucket}/${item.Key}`;
                } else {
                    url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${item.Key}`;
                }
            }

            return {
                key: item.Key || "",
                lastModified: item.LastModified,
                size: item.Size,
                url
            };
        }));

        return storedFiles;
    } catch (e) {
        console.error("List Files Error:", e);
        return [];
    }
}

export async function saveUrlToVault(config: S3Config, fileUrl: string, folder: string, filename: string): Promise<string | null> {
    try {
        // 1. Fetch the file
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch source file: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // 2. Upload to S3
        const client = getS3Client(config);
        const key = `${folder}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType
        });

        await client.send(command);

        // 3. Return public/access URL
        if (config.endpoint) {
            return `${config.endpoint}/${config.bucket}/${key}`;
        } else {
            return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
        }
    } catch (e) {
        console.error("Save URL to Vault Error:", e);
        return null;
    }
}

export async function saveContentToVault(config: S3Config, content: string, folder: string, filename: string, contentType: string = "text/markdown"): Promise<string | null> {
    try {
        const client = getS3Client(config);
        const key = `${folder}/${filename}`;

        await client.send(new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Body: content,
            ContentType: contentType
        }));

        return key;
    } catch (e) {
        console.error("Save Content to Vault Error:", e);
        return null;
    }
}
