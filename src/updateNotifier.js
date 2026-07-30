function showBanner(onReload) {
  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.innerHTML = `<span>Update available</span><button>Reload</button>`;
  banner.querySelector("button").addEventListener("click", onReload);
  document.body.appendChild(banner);
}

export function watchForUpdates() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("sw.js").catch(() => {});

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      showBanner(() => registration.waiting.postMessage("SKIP_WAITING"));
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showBanner(() => newWorker.postMessage("SKIP_WAITING"));
        }
      });
    });
  });
}
