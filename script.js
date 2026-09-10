(() => {
  const config = window.JOYPOINTER_CONFIG || {};
  const checkoutUrl = String(config.checkoutUrl || "");
  const isPlaceholderCheckout =
    checkoutUrl === "" ||
    checkoutUrl.includes("STORE.lemonsqueezy.com") ||
    checkoutUrl.includes("VARIANT_UUID");

  document.querySelectorAll("[data-price]").forEach((element) => {
    element.textContent = config.price || "$22";
  });

  document.querySelectorAll("[data-activation-limit]").forEach((element) => {
    element.textContent = String(config.activationLimit || 3);
  });

  document.querySelectorAll("[data-support-email]").forEach((element) => {
    const email = config.supportEmail || "me@heg.wtf";
    element.textContent = email;
    if (element.tagName === "A") {
      element.href = `mailto:${email}`;
    }
  });

  document.querySelectorAll("[data-download]").forEach((element) => {
    if (/^https:\/\/github\.com\//.test(config.downloadUrl || "")) {
      element.href = config.downloadUrl;
      element.rel = "noopener";
    }
  });

  const buyButtons = document.querySelectorAll("[data-buy]");

  if (isPlaceholderCheckout) {
    // Never ship a dead checkout link: degrade to an anchored, clearly disabled button.
    buyButtons.forEach((button) => {
      button.classList.remove("lemonsqueezy-button");
      button.classList.add("is-pending");
      button.href = "#pricing";
      button.setAttribute("aria-disabled", "true");
      const label = button.querySelector("[data-buy-label]") || button;
      label.textContent = "Checkout opens soon";
    });
    document.querySelectorAll("[data-checkout-status]").forEach((element) => {
      element.hidden = false;
    });
    return;
  }

  buyButtons.forEach((button) => {
    button.href = checkoutUrl;
    button.classList.add("lemonsqueezy-button");
  });

  // lemon.js scans for .lemonsqueezy-button on load; re-run in case it loaded first.
  const initializeOverlay = () => {
    if (typeof window.createLemonSqueezy === "function") {
      window.createLemonSqueezy();
    }
  };
  if (document.readyState === "complete") {
    initializeOverlay();
  } else {
    window.addEventListener("load", initializeOverlay, { once: true });
  }
})();
