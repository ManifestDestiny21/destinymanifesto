/**
 * Remove anything this app stored on the device for the signed-in user.
 * Run on logout so personal data doesn't linger on shared or borrowed phones.
 */
export async function clearLocalUserData(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("dm-")) window.localStorage.removeItem(key);
    }
    window.sessionStorage.clear();
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }

  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHES" });
  } catch {
    // Best effort.
  }
}
