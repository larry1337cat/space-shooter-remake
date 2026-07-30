function showBanner(onReload) {
  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.innerHTML = `<span>Update available</span><button>Reload</button>`;
  banner.querySelector("button").addEventListener("click", onReload);
  document.body.appendChild(banner);
}

function whenAtMenu(isMenu, callback) {
  if (isMenu()) {
    callback();
    return;
  }
  const interval = setInterval(() => {
    if (!isMenu()) return;
    clearInterval(interval);
    callback();
  }, 1000);
}

export function watchForUpdates(isMenu) {
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
      whenAtMenu(isMenu, () => showBanner(() => registration.waiting.postMessage("SKIP_WAITING")));
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          whenAtMenu(isMenu, () => showBanner(() => newWorker.postMessage("SKIP_WAITING")));
        }
      });
    });
  });
}
