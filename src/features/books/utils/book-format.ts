/**
 * Physical vs. digital classification for book format variants.
 *
 * This mirrors `isPhysicalFormat()` in the backend contract
 * (`libs/contract/src/books/enums/book-format.enum.ts`). The backend enum is the
 * source of truth and currently carries more members than the admin panel's
 * format `<Select>` offers:
 *
 *   physical -> hardcover | paperback | physical
 *   digital  -> ebook | pdf | epub | audiobook | docx | worksheet
 *
 * The predicate is written against the *physical* set rather than the digital
 * one on purpose: that is exactly how the backend decides, and it means a format
 * added to the enum later (another digital deliverable, most likely) is treated
 * as digital by both sides instead of silently drifting apart.
 */

/** Formats that ship in a box. Kept in sync with `BookFormat` on the backend. */
export const PHYSICAL_BOOK_FORMATS = [
  "hardcover",
  "paperback",
  "physical",
] as const;

/**
 * True for formats that are shipped physically and therefore have no
 * downloadable deliverable.
 *
 * Returns `false` for an absent format so callers treat "nothing selected yet"
 * as "not yet known to be physical" rather than defaulting either way.
 */
export const isPhysicalFormat = (format?: string | null): boolean => {
  if (!format) return false;
  return (PHYSICAL_BOOK_FORMATS as readonly string[]).includes(
    format.toLowerCase(),
  );
};

/**
 * True for formats whose product *is* a file — the ebook/audiobook the buyer is
 * emailed a secure download link for after payment.
 *
 * Deliberately false when no format has been chosen yet, so the deliverable
 * uploader does not flash into view on a half-filled variant row.
 */
export const isDigitalFormat = (format?: string | null): boolean => {
  if (!format) return false;
  return !isPhysicalFormat(format);
};

/**
 * Accepted deliverable types, in the shape `react-dropzone` wants
 * (`{ [mimeType]: extensions[] }`).
 *
 * Scoped to what this store actually sells — ebooks and audiobooks — rather
 * than every file type the storage layer would technically accept. `.zip` is
 * included because a multi-part audiobook is usually delivered as one archive.
 *
 * Note this is a *convenience* filter in the file picker, not a security
 * boundary: `POST /admin/upload` runs with the `other` upload type, which
 * applies no MIME allowlist server-side.
 */
export const DIGITAL_MATERIAL_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/epub+zip": [".epub"],
  "application/x-mobipocket-ebook": [".mobi"],
  "audio/mpeg": [".mp3"],
  "audio/mp4": [".m4a", ".m4b"],
  "audio/x-m4a": [".m4a"],
  "application/zip": [".zip"],
};

/** Human-readable version of {@link DIGITAL_MATERIAL_ACCEPT}, for helper text. */
export const DIGITAL_MATERIAL_EXTENSIONS = [
  ".pdf",
  ".epub",
  ".mobi",
  ".mp3",
  ".m4a",
  ".zip",
];

/**
 * Client-side size guard for a deliverable, in bytes.
 *
 * The API gateway registers no `MulterModule` options, so the server imposes no
 * explicit per-file cap and uploads buffer in memory. This ceiling exists to
 * fail fast in the browser with a readable message instead of pushing a
 * multi-hundred-megabyte body at the gateway and finding out the hard way.
 * Long audiobooks can legitimately exceed it — see the follow-ups in the
 * eng-log if that starts biting.
 */
export const MAX_DIGITAL_MATERIAL_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Best-effort display name for an already-stored deliverable.
 *
 * Stored objects are keyed `other/<name>_<timestamp>_<uuid><ext>` by
 * `UploadToStorageProvider.generateFileName`, so the last path segment is the
 * most useful thing we can show. The timestamp/uuid suffix is stripped when it
 * matches that exact shape and left alone otherwise, so a key written by some
 * other code path degrades to "show the raw segment" rather than to a wrong name.
 */
export const digitalMaterialFileName = (url?: string | null): string => {
  if (!url) return "";

  const withoutQuery = url.split("?")[0];
  const segment = withoutQuery.split("/").filter(Boolean).pop() ?? "";

  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // Malformed percent-encoding: fall back to the raw segment.
  }

  return decoded.replace(
    /_\d{10,}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[^.]+)?$/i,
    "$1",
  );
};

/** Formats a byte count for the uploader's secondary line. */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
