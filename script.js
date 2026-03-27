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
const siteBackground = document.querySelector(".site-background");
const siteHeader = document.querySelector(".site-header");
const siteHeaderBar = siteHeader?.querySelector(".site-header-bar");
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

function openModal(key) {
  if (!modal) {
    return;
  }

  setModalContent(key);
  modal.classList.remove("hidden");
  updateBodyScrollLock();
}

function closeModal() {
  if (!modal) {
    return;
  }

  modal.classList.add("hidden");
  updateBodyScrollLock();
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

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const topic = document.getElementById("help-topic").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!firstName || !lastName || !email || !topic || !message) {
    formNote.textContent = "Please complete all required fields.";
    return;
  }

  const subject = encodeURIComponent(`Contact Us: ${topic}`);
  const body = encodeURIComponent(
    [
      `First name: ${firstName}`,
      `Last name: ${lastName}`,
      `Email: ${email}`,
      `How can we help you?: ${topic}`,
      "",
      "Message:",
      message
    ].join("\n")
  );

  window.location.href = `mailto:vulvaverse@gmail.com?subject=${subject}&body=${body}`;
  contactForm.reset();
  formNote.textContent = "Thanks, we received your submission.";
});

function updateUniverseBackground() {
  if (!siteBackground) {
    return;
  }

  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );
  const progress = Math.min(window.scrollY / maxScroll, 1);
  const startOffset = 48;
  const endOffset = -48;
  const offset = startOffset + (endOffset - startOffset) * progress;

  siteBackground.style.setProperty("--bg-shift", `${offset}px`);
}

function updateMobileHeaderState() {
  if (!siteHeader) {
    return;
  }

  const isMobile = window.innerWidth <= 760;
  const isScrolled = window.scrollY > 120;

  siteHeader.classList.toggle("mobile-scrolled", isMobile && isScrolled);

  if (!isCollapsedNav()) {
    closeMobileMenu({ immediate: true });
    syncCollapsedHeaderOffset();
    return;
  }

  syncMobileMenuMetrics();
  syncCollapsedHeaderOffset();
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
updateMobileHeaderState();
window.addEventListener("scroll", updateUniverseBackground, { passive: true });
window.addEventListener("scroll", updateMobileHeaderState, { passive: true });
document.addEventListener(
  "wheel",
  (event) => {
    if (!isMobileMenuOpen()) {
      return;
    }

    const deltaY = normalizeWheelDelta(event);

    if (Math.abs(deltaY) < 0.5) {
      return;
    }

    event.preventDefault();
    applyMenuGestureDelta(deltaY);
  },
  { passive: false, capture: true }
);
document.addEventListener(
  "touchstart",
  (event) => {
    if (!isMobileMenuOpen()) {
      menuTouchY = null;
      return;
    }

    menuTouchY = event.touches[0]?.clientY ?? null;
  },
  { passive: true, capture: true }
);
document.addEventListener(
  "touchmove",
  (event) => {
    if (!isMobileMenuOpen()) {
      menuTouchY = null;
      return;
    }

    const currentTouchY = event.touches[0]?.clientY;

    if (typeof currentTouchY !== "number") {
      return;
    }

    if (menuTouchY === null) {
      menuTouchY = currentTouchY;
      return;
    }

    const deltaY = menuTouchY - currentTouchY;

    if (Math.abs(deltaY) < 0.5) {
      return;
    }

    event.preventDefault();
    applyMenuGestureDelta(deltaY);
    menuTouchY = currentTouchY;
  },
  { passive: false, capture: true }
);
document.addEventListener(
  "touchend",
  () => {
    menuTouchY = null;
  },
  { capture: true }
);
document.addEventListener(
  "touchcancel",
  () => {
    menuTouchY = null;
  },
  { capture: true }
);
window.addEventListener("blur", () => {
  menuTouchY = null;
});
window.addEventListener("resize", () => {
  updateUniverseBackground();
  updateMobileHeaderState();
});
