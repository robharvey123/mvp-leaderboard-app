// src/lib/storage.ts
import { supabase } from "@/lib/supabaseClient";

export const CLUB_ASSETS_BUCKET = "club-assets";

/** Ensure the public bucket exists (idempotent). */
export async function ensureBucketExists(bucket = CLUB_ASSETS_BUCKET): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;

  const { error: createErr } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  });
  if (createErr) throw createErr;
}

/** Build a public URL for a stored object (empty string if no path). */
export function getPublicUrl(path?: string | null, bucket = CLUB_ASSETS_BUCKET): string {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function extensionOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

/** Upload a logo for a club and return { path, publicUrl }. */
export async function uploadClubLogo(
  clubId: string,
  file: File,
  bucket = CLUB_ASSETS_BUCKET
): Promise<{ path: string; publicUrl: string }> {
  await ensureBucketExists(bucket);

  const path = `${clubId}/logo-${Date.now()}${extensionOf(file.name) || ".png"}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw error;

  return { path, publicUrl: getPublicUrl(path, bucket) };
}
