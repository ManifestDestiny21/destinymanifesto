"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const noopSubscribe = () => () => {};

function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectIosSafari(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
  return isIos && isSafari;
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const isStandalone = useSyncExternalStore(noopSubscribe, detectStandalone, () => false);
  const isIosSafari = useSyncExternalStore(noopSubscribe, detectIosSafari, () => false);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const showIosHint = isIosSafari && !iosHintDismissed;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration failures in local/dev environments.
      });
    }

    if (detectStandalone()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setInstallEvent(null);
    }
  }

  if (installed || isStandalone) return null;

  if (installEvent) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-[#01696f]/25 bg-white p-4 shadow-lg md:bottom-6">
        <p className="text-sm font-semibold text-[#28251d]">Install Destiny Manifesto</p>
        <p className="mt-1 text-xs text-[#7a7974]">
          Add the app to your phone home screen for quick access.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full rounded-xl bg-[#01696f] px-4 py-2 text-sm font-semibold text-white"
        >
          Download / Install app
        </button>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-[#01696f]/25 bg-white p-4 shadow-lg md:bottom-6">
        <p className="text-sm font-semibold text-[#28251d]">Add to iPhone home screen</p>
        <p className="mt-1 text-xs leading-relaxed text-[#7a7974]">
          Tap the Share button, then choose <strong>Add to Home Screen</strong> to install
          Destiny Manifesto like an app.
        </p>
        <button
          type="button"
          onClick={() => setIosHintDismissed(true)}
          className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-medium"
        >
          Got it
        </button>
      </div>
    );
  }

  return null;
}
