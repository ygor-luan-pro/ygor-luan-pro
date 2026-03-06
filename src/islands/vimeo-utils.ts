export function shouldSaveWatchTime(currentSeconds: number, lastSavedSeconds: number): boolean {
  return currentSeconds - lastSavedSeconds >= 30;
}

export function shouldAutoComplete(
  seconds: number,
  duration: number,
  threshold = 0.9,
): boolean {
  return duration > 0 && seconds / duration >= threshold;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}
