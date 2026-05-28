const menuToggle = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");
const faqButtons = document.querySelectorAll(".faq-question");
const modal = document.getElementById("modal");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalButtons = document.querySelectorAll("[data-modal]");
const closeModalButtons = document.querySelectorAll("[data-close-modal]");
const contactForm = document.getElementById("contact-form");
const formNote = document.getElementById("form-note");
const contactSubmitButton = document.getElementById("contact-submit");
const siteBackground = document.querySelector(".site-background");
const siteHeader = document.querySelector(".site-header");
const siteHeaderBar = siteHeader?.querySelector(".site-header-bar");
const CONTACT_FORM_SOURCE_FALLBACK = "website-contact-form";
const CONTACT_FORM_ENDPOINT_PLACEHOLDER = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
const CONTACT_FORM_MIN_FILL_SECONDS = 3;
const contactFormReadyAt = Date.now();
if (siteNav && !siteNav.querySelector(".site-nav-links")) {
  const navLinksWrapper = document.createElement("div");
  navLinksWrapper.className = "site-nav-links";

  Array.from(siteNav.querySelectorAll("a")).forEach((link) => {
    navLinksWrapper.append(link);
  });

  const navSensor = document.createElement("div");
  navSensor.className = "site-nav-sensor";
  navSensor.setAttribute("aria-hidden", "true");
  siteNav.append(navLinksWrapper, navSensor);
}

const siteNavLinksWrapper = siteNav?.querySelector(".site-nav-links");
const navLinks = document.querySelectorAll('a[href^="#"]');
let menuProgress = 0;
let menuOpenHeight = 0;
let menuScrollDistance = 160;
let menuTouchY = null;
let menuGestureTimeout = null;
let menuCloseTimeout = null;
let isPageScrollLocked = false;
const MENU_SCROLL_DISTANCE_MIN = 132;
const MENU_SCROLL_DISTANCE_MAX = 176;
const MENU_SCROLL_DISTANCE_RATIO = 0.34;
const MENU_CLOSE_THRESHOLD = 0.11;
const MENU_OPEN_PADDING_TOP = 22;
const MENU_OPEN_PADDING_BOTTOM = 6;

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function forcePageTop() {
  if (window.location.hash) {
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (error) {
      // Some local previews can reject replaceState; skipping it keeps the page usable.
    }
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  });
}

document.addEventListener("DOMContentLoaded", forcePageTop);
window.addEventListener("load", forcePageTop);
window.addEventListener("pageshow", forcePageTop);

function isCollapsedNav() {
  return window.innerWidth <= 1100;
}

function isMobileMenuOpen() {
  return isCollapsedNav() && !!siteNav?.classList.contains("open");
}

function setPageScrollLock(shouldLock) {
  if (shouldLock && !isPageScrollLocked) {
    document.documentElement.classList.add("page-scroll-locked");
    document.body.classList.add("page-scroll-locked");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    isPageScrollLocked = true;
    return;
  }

  if (!shouldLock && isPageScrollLocked) {
    document.documentElement.classList.remove("page-scroll-locked");
    document.body.classList.remove("page-scroll-locked");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    isPageScrollLocked = false;
  }
}

function updateBodyScrollLock() {
  const modalOpen = !!modal && !modal.classList.contains("hidden");
  setPageScrollLock(modalOpen);
}

function syncCollapsedHeaderOffset() {
  const nextOffset =
    siteHeader && siteHeaderBar && isCollapsedNav() ? Math.ceil(siteHeader.offsetHeight + 12) : 0;
  document.documentElement.style.setProperty("--header-offset", `${nextOffset}px`);
}

function syncMobileMenuMetrics() {
  if (!siteNav || !siteHeader || !siteHeaderBar || !siteNavLinksWrapper || !isCollapsedNav()) {
    return 0;
  }

  const measuredHeight =
    siteNavLinksWrapper.scrollHeight + MENU_OPEN_PADDING_TOP + MENU_OPEN_PADDING_BOTTOM;
  const overlayHeight = Math.min(measuredHeight, Math.max(window.innerHeight - 140, 220));
  const measuredScrollDistance = Math.round(
    Math.max(
      MENU_SCROLL_DISTANCE_MIN,
      Math.min(MENU_SCROLL_DISTANCE_MAX, overlayHeight * MENU_SCROLL_DISTANCE_RATIO)
    )
  );

  menuOpenHeight = overlayHeight;
  menuScrollDistance = measuredScrollDistance;
  siteHeader.style.setProperty("--menu-open-height", `${overlayHeight}px`);
  siteHeader.style.setProperty("--menu-scroll-distance", `${measuredScrollDistance}px`);

  return overlayHeight;
}

function applyMobileMenuProgress(progress) {
  if (!siteHeader) {
    return;
  }

  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const openHeight = menuOpenHeight || syncMobileMenuMetrics();

  menuProgress = clampedProgress;
  siteHeader.style.setProperty("--menu-progress", `${clampedProgress}`);
  siteHeader.style.setProperty(
    "--menu-current-height",
    `${Math.round(openHeight * clampedProgress)}px`
  );
}

function stopMenuGestureState() {
  if (menuGestureTimeout !== null) {
    window.clearTimeout(menuGestureTimeout);
    menuGestureTimeout = null;
  }

  siteHeader?.classList.remove("menu-scrolling");
}

function startMenuGestureState() {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.add("menu-scrolling");

  if (menuGestureTimeout !== null) {
    window.clearTimeout(menuGestureTimeout);
  }

  menuGestureTimeout = window.setTimeout(() => {
    siteHeader.classList.remove("menu-scrolling");
    menuGestureTimeout = null;
  }, 96);
}

function finishClosingMobileMenu() {
  if (menuCloseTimeout !== null) {
    window.clearTimeout(menuCloseTimeout);
    menuCloseTimeout = null;
  }

  stopMenuGestureState();
  siteNav?.classList.remove("open");
  siteHeader?.classList.remove("mobile-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuTouchY = null;
  menuProgress = 0;
  siteHeader?.style.setProperty("--menu-progress", "0");
  siteHeader?.style.setProperty("--menu-current-height", "0px");
  updateBodyScrollLock();
}

function scheduleClosingMobileMenu() {
  if (menuCloseTimeout !== null) {
    window.clearTimeout(menuCloseTimeout);
  }

  menuCloseTimeout = window.setTimeout(() => {
    if (menuProgress <= MENU_CLOSE_THRESHOLD) {
      finishClosingMobileMenu();
    }
  }, 220);
}

function openMobileMenu() {
  if (!siteNav || !siteHeader) {
    return;
  }

  if (menuCloseTimeout !== null) {
    window.clearTimeout(menuCloseTimeout);
    menuCloseTimeout = null;
  }

  siteNav.classList.add("open");
  siteHeader.classList.add("mobile-menu-open");
  menuToggle?.setAttribute("aria-expanded", "true");
  menuTouchY = null;
  applyMobileMenuProgress(0);
  syncMobileMenuMetrics();
  syncCollapsedHeaderOffset();

  requestAnimationFrame(() => {
    syncMobileMenuMetrics();
    applyMobileMenuProgress(1);
  });
}

function closeMobileMenu(options = {}) {
  const { immediate = false } = options;

  if (!siteNav) {
    return;
  }

  if (immediate || !siteNav.classList.contains("open")) {
    finishClosingMobileMenu();
    return;
  }

  applyMobileMenuProgress(0);
  scheduleClosingMobileMenu();
  updateBodyScrollLock();
}

function normalizeWheelDelta(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 28;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }

  if (Math.abs(event.deltaY) >= 48) {
    return event.deltaY * 1.12;
  }

  return event.deltaY * 1.04;
}

function applyMenuGestureDelta(deltaY) {
  if (!isMobileMenuOpen()) {
    return;
  }

  const signedDelta = Number(deltaY) || 0;
  const direction = Math.sign(signedDelta) || 1;
  const magnitude = Math.abs(signedDelta);

  if (magnitude < 0.5) {
    return;
  }

  startMenuGestureState();
  if (menuCloseTimeout !== null) {
    window.clearTimeout(menuCloseTimeout);
    menuCloseTimeout = null;
  }

  const pixelsRemainingToClose = Math.max(
    (menuProgress - MENU_CLOSE_THRESHOLD) * Math.max(menuScrollDistance, 1),
    0
  );

  if (magnitude >= pixelsRemainingToClose) {
    const overflowDelta = magnitude - pixelsRemainingToClose;
    finishClosingMobileMenu();

    if (overflowDelta > 0.5) {
      window.requestAnimationFrame(() => {
        window.scrollBy({ top: direction * overflowDelta, left: 0, behavior: "auto" });
      });
    }

    return;
  }

  const nextProgress = menuProgress - magnitude / Math.max(menuScrollDistance, 1);
  applyMobileMenuProgress(nextProgress);

  if (menuProgress <= MENU_CLOSE_THRESHOLD) {
    finishClosingMobileMenu();
  }
}

const modalContent = {
  mission: {
    kicker: "Vulvastic Mission",
    title: "Reshaping the Way We Speak of the Vulva",
    body: [
      "Vulvaverse is a space dedicated to breaking down barriers of stigma and taboo. We foster significant body knowledge, ensuring the vulva is recognized for its unique beauty and distinguished from the vagina.",
      "Join us in celebrating a part of ourselves that is rich with stories, shaped by culture, yet entirely our own."
    ]
  },
  join: {
    kicker: "Join Vulvaverse",
    title: "Step Into The Space",
    body: [
      "Join Vulvaverse through workshops, 1:1 sessions, community conversations, and collaborations centered on body knowledge, celebration, and reclaiming the vulva from shame.",
      "If you want to connect directly, scroll to the Contact section or reach out via vulvaverse@gmail.com and Instagram @vul_vaverse."
    ]
  },
  talk: {
    kicker: "VulvaTalks",
    title: "Collective Wisdom",
    body: [
      "Join an open group session where everyone is invited to come with their questions and knowledge.",
      "We learn from each other in a collaborative environment, bringing curiosity and shared insights to foster collective growth and celebration of our bodies."
    ]
  },
  workbook: {
    kicker: "Workbook",
    title: "Mirror, mirror - Oh Vulvina!",
    body: [
      "A guide to meet your Vulva. The workbook gives you a symbolic hand and is with you all the way on the journey to meet and (re-)connect with your Vulva.",
      "With ecercises and enough room to write down your notes, thoughts and feelings this guides let you meet your vulva from a totally new perspective."
    ]
  },
  "story-journey": {
    kicker: "Blog",
    title: "My Journey from coach to Jewelery designer",
    body: [
      "While I was pitching my workshops and ended up creating Jewelery and selling them on markets."
    ]
  },
  "story-anatomy": {
    kicker: "Blog",
    title: "Vulvastic Anatomy",
    body: [
      "Discover the forgotten and erased anatomy of the vulva."
    ]
  },
  "story-clit": {
    kicker: "Blog",
    title: "Big Clit Energy",
    body: [
      "Do you knoe the true size of your Clit?"
    ]
  },
  privacy: {
    kicker: "Privacy",
    title: "How we handle your data",
    body: [
      "Your name, email, topic and message are sent to a private Google Sheet that only Anna can access. A notification is also emailed to vulvaverse@gmail.com so we can reply.",
      "Your data is used only to respond to your inquiry. It is never sold, shared with third parties, or used for marketing.",
      "Submissions are stored for up to 12 months and then automatically deleted.",
      "You can request a copy or earlier deletion of your data at any time by emailing vulvaverse@gmail.com."
    ]
  }
};

function setModalContent(key) {
  const content = modalContent[key];

  if (!content || !modalKicker || !modalTitle || !modalBody) {
    return;
  }

  modalKicker.textContent = content.kicker;
  modalTitle.textContent = content.title;
  modalBody.innerHTML = content.body.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

let modalCloseTimer = null;

function openModal(key) {
  if (!modal) {
    return;
  }

  if (modalCloseTimer !== null) {
    window.clearTimeout(modalCloseTimer);
    modalCloseTimer = null;
  }

  setModalContent(key);
  modal.classList.remove("hidden", "is-closing");
  updateBodyScrollLock();
}

function closeModal() {
  if (!modal || modal.classList.contains("hidden")) {
    return;
  }

  modal.classList.add("is-closing");

  if (modalCloseTimer !== null) {
    window.clearTimeout(modalCloseTimer);
  }

  modalCloseTimer = window.setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("is-closing");
    modalCloseTimer = null;
    updateBodyScrollLock();
  }, 300);
}

menuToggle?.addEventListener("click", () => {
  if (!siteNav) {
    return;
  }

  if (siteNav.classList.contains("open")) {
    closeMobileMenu();
    return;
  }

  openMobileMenu();
});

document.addEventListener(
  "click",
  (event) => {
    if (!isMobileMenuOpen() || !siteNav || !siteHeaderBar) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (siteNav.contains(target) || siteHeaderBar.contains(target)) {
      return;
    }

    closeMobileMenu();
  },
  { capture: true }
);

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");

    if (!item) {
      return;
    }

    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

modalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openModal(button.dataset.modal);
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (modal && !modal.classList.contains("hidden")) {
    closeModal();
    return;
  }

  if (isMobileMenuOpen()) {
    closeMobileMenu();
  }
});

function setContactFormNote(message = "", state = "") {
  if (!formNote) {
    return;
  }

  formNote.textContent = message;
  formNote.classList.remove("is-error", "is-success", "is-loading");

  if (state) {
    formNote.classList.add(`is-${state}`);
  }
}

function setContactFormSubmitting(isSubmitting) {
  if (!contactForm || !contactSubmitButton) {
    return;
  }

  contactForm.classList.toggle("is-submitting", isSubmitting);
  contactForm.setAttribute("aria-busy", String(isSubmitting));
  contactSubmitButton.disabled = isSubmitting;
  contactSubmitButton.textContent = isSubmitting ? "Sending..." : "Submit";
}

function getContactFormEndpoint() {
  const endpoint = contactForm?.dataset.endpoint?.trim() || "";

  if (!endpoint || endpoint === CONTACT_FORM_ENDPOINT_PLACEHOLDER) {
    return "";
  }

  return endpoint;
}

async function submitContactLead(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    mode: "cors",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      responseData = null;
    }
  }

  if (!response.ok || responseData?.ok === false) {
    throw new Error(responseData?.message || "Unable to save your message right now.");
  }

  return responseData;
}

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    setContactFormNote("Please complete all required fields.", "error");
    return;
  }

  const endpoint = getContactFormEndpoint();
  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const topic = document.getElementById("help-topic").value.trim();
  const message = document.getElementById("message").value.trim();
  const website = document.getElementById("website").value.trim();
  const consentGiven = document.getElementById("consent").checked;
  const elapsedSeconds = (Date.now() - contactFormReadyAt) / 1000;

  if (!firstName || !lastName || !email || !topic || !message) {
    setContactFormNote("Please complete all required fields.", "error");
    return;
  }

  if (!consentGiven) {
    setContactFormNote("Please accept the privacy terms to continue.", "error");
    return;
  }

  if (!endpoint) {
    setContactFormNote(
      "Connect the contact form to your Google Apps Script web app URL to receive submissions.",
      "error"
    );
    return;
  }

  if (website || elapsedSeconds < CONTACT_FORM_MIN_FILL_SECONDS) {
    contactForm.reset();
    setContactFormNote("Thanks, we received your submission.", "success");
    return;
  }

  const payload = {
    first_name: firstName,
    last_name: lastName,
    email,
    topic,
    message,
    page_url: window.location.href,
    source: contactForm.dataset.source?.trim() || CONTACT_FORM_SOURCE_FALLBACK,
    website,
    consent: consentGiven ? "yes" : "",
    submitted_after_seconds: Math.round(elapsedSeconds)
  };

  try {
    setContactFormSubmitting(true);
    setContactFormNote("Sending your message...", "loading");
    await submitContactLead(endpoint, payload);
    contactForm.reset();
    setContactFormNote("Thanks, we received your submission.", "success");
  } catch (error) {
    console.error("Contact form submission error:", error);
    setContactFormNote(
      "We couldn't send your message right now. Please try again in a moment.",
      "error"
    );
  } finally {
    setContactFormSubmitting(false);
  }
});

function updateUniverseBackground() {
  // Parallax disabled for perf — background is now fixed.
  // Kept as no-op so existing scroll/resize listeners stay valid.
}

let mobileHeaderFrameId = null;

function updateMobileHeaderState() {
  if (!siteHeader || mobileHeaderFrameId !== null) {
    return;
  }

  mobileHeaderFrameId = window.requestAnimationFrame(() => {
    mobileHeaderFrameId = null;
    runMobileHeaderStateUpdate();
  });
}

function runMobileHeaderStateUpdate() {
  if (!siteHeader) {
    return;
  }

  if (!isCollapsedNav()) {
    closeMobileMenu({ immediate: true });
    return;
  }

  // Skip metric recalcs while the menu is closed — they read layout
  // and were the main source of jank when scrolling on mobile.
  if (isMobileMenuOpen()) {
    syncMobileMenuMetrics();
  }
  updateBodyScrollLock();
}

function getHeaderOffset() {
  const headerBar = siteHeader?.querySelector(".site-header-bar");
  const headerHeight = headerBar?.getBoundingClientRect().height ?? 0;
  const headerTopPadding = siteHeader ? parseFloat(getComputedStyle(siteHeader).paddingTop) || 0 : 0;
  return headerHeight + headerTopPadding + 16;
}

function scrollToSection(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const offset = getHeaderOffset();
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const nextTop = Math.max(targetTop - offset, 0);

  window.scrollTo({
    top: nextTop,
    behavior: "smooth"
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (!href || href === "#" || !href.startsWith("#")) {
      return;
    }

    const targetId = href.slice(1);
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();

    if (isCollapsedNav()) {
      closeMobileMenu({ immediate: true });
    }

    scrollToSection(targetId);
  });
});

updateUniverseBackground();
syncCollapsedHeaderOffset();
updateMobileHeaderState();
// Header offset only depends on viewport, not scroll — compute on resize only.
window.addEventListener("scroll", updateUniverseBackground, { passive: true });
window.addEventListener("scroll", updateMobileHeaderState, { passive: true });
// Finger-following menu close: while the menu is open, dragging up
// shrinks it 1:1 with the finger. On release, it snaps open or closed
// depending on how far you dragged. CSS transitions are disabled
// mid-drag so the menu stays glued to the finger.
let menuDragStartY = null;
let menuDragStartProgress = 1;
let menuDragActive = false;

document.addEventListener(
  "touchstart",
  (event) => {
    if (!isMobileMenuOpen()) {
      menuDragStartY = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    menuDragStartY = touch.clientY;
    menuDragStartProgress = menuProgress;
    menuDragActive = false;
  },
  { passive: true, capture: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!isMobileMenuOpen() || menuDragStartY === null) return;
    const touch = event.touches[0];
    if (!touch) return;

    const deltaY = menuDragStartY - touch.clientY;
    const openHeight = menuOpenHeight || syncMobileMenuMetrics();
    if (openHeight < 1) return;

    if (!menuDragActive && Math.abs(deltaY) < 6) return;

    if (!menuDragActive) {
      menuDragActive = true;
      siteHeader?.classList.add("menu-dragging");
    }

    event.preventDefault();
    const nextProgress = menuDragStartProgress - deltaY / openHeight;
    applyMobileMenuProgress(Math.max(0, Math.min(1, nextProgress)));
  },
  { passive: false, capture: true }
);

function endMenuDrag() {
  if (!menuDragActive) {
    menuDragStartY = null;
    return;
  }
  siteHeader?.classList.remove("menu-dragging");

  if (menuProgress < 0.5) {
    finishClosingMobileMenu();
  } else {
    applyMobileMenuProgress(1);
  }

  menuDragStartY = null;
  menuDragActive = false;
}

document.addEventListener("touchend", endMenuDrag, { passive: true, capture: true });
document.addEventListener("touchcancel", endMenuDrag, { passive: true, capture: true });
window.addEventListener("resize", () => {
  updateUniverseBackground();
  syncCollapsedHeaderOffset();
  updateMobileHeaderState();
});
