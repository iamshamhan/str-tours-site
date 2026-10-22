import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
export const PUBLIC_CONTENT_TAG = "public-content";
export function cachedPublic<T>(key: string, load: () => Promise<T>) {
  return unstable_cache(load, ["public-v2", key], {
    revalidate: 60,
    tags: [PUBLIC_CONTENT_TAG, "public:" + key.split(":")[0]],
  })();
}
export function invalidatePublicContent() {
  revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
}
export class PublicDataError extends Error {
  constructor() {
    super("Something went wrong, please try again.");
    this.name = "PublicDataError";
  }
}
export function dataFailure(operation: string, error?: { code?: string } | null): never {
  console.error("Public data unavailable", {
    operation,
    code: error?.code ?? "FETCH_OR_VALIDATION_FAILED",
  });
  throw new PublicDataError();
}
export async function publicRead<T>(operation: string, read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof PublicDataError) throw error;
    return dataFailure(operation);
  }
}
