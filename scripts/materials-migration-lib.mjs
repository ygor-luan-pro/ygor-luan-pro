const MIME_TO_EXTENSION = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function isExternalUrl(fileUrl) {
  return /^https?:\/\//i.test(fileUrl);
}

export function extractGoogleDriveFileId(fileUrl) {
  try {
    const url = new URL(fileUrl);
    if (url.hostname !== 'drive.google.com') return null;

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    return url.searchParams.get('id');
  } catch {
    return null;
  }
}

export function toDownloadableMaterialUrl(fileUrl) {
  const fileId = extractGoogleDriveFileId(fileUrl);
  if (!fileId) return fileUrl;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getFilenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? null;
}

export function sanitizeFilename(fileName) {
  return (fileName.normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'material');
}

export function inferExtension({ fileName, contentType }) {
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i);
  if (extMatch?.[1]) return extMatch[1].toLowerCase();
  return MIME_TO_EXTENSION[contentType ?? ''] ?? 'bin';
}

export function getAllowedMimeType(extension) {
  const normalizedExtension = extension.toLowerCase();
  return Object.entries(MIME_TO_EXTENSION).find(([, ext]) => ext === normalizedExtension)?.[0] ?? null;
}
