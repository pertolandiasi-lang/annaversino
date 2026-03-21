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
const navLinks = document.querySelectorAll('a[href^="#"]');
const siteNavLinks = siteNav?.querySelectorAll("a") ?? [];
let mobileMenuScrollAnchor = 0;
let mobileMenuProgress = 1;
let mobileMenuTargetProgress = 1;
let mobileMenuAnimationFrame = null;
let mobileMenuOpenHeight = 0;
let mobileMenuLinkMetrics = [];
let mobileMenuGestureOffset = 0;
let mobileMenuTouchY = null;
const MOBILE_MENU_ROW_HEIGHT = 58;
const MOBILE_MENU_ROW_VISIBLE_HEIGHT = 54;
const MOBILE_MENU_FIRST_ROW_MARGIN = 4;
const MOBILE_MENU_ROW_MARGIN = 10;
const MOBILE_MENU_TOP_PADDING = 34;
const MOBILE_MENU_BOTTOM_PADDING = 16;
const MOBILE_MENU_COLLAPSE_DISTANCE = 120;

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function forcePageTop() {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
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

function syncMobileMenuMetrics() {
  if (!siteNav || !siteHeader || window.innerWidth > 760) {
    return;
  }

  const wasOpen = siteNav.classList.contains("open");
  const previousInlineMaxHeight = siteNav.style.maxHeight;
  const previousInlineOpacity = siteNav.style.opacity;
  const previousInlineTransform = siteNav.style.transform;
  const previousInlinePointerEvents = siteNav.style.pointerEvents;
  const previousInlineOverflow = siteNav.style.overflow;

  if (!wasOpen) {
    siteNav.classList.add("open");
  }

  const previousProgress = mobileMenuProgress;
  siteHeader.style.setProperty("--mobile-menu-progress", "1");
  siteNavLinks.forEach((link) => {
    link.style.setProperty("--menu-link-progress", "1");
  });

  siteNav.style.maxHeight = "none";
  siteNav.style.opacity = "1";
  siteNav.style.transform = "none";
  siteNav.style.pointerEvents = "auto";
  siteNav.style.overflow = "visible";

  const measuredMetrics = Array.from(siteNavLinks, (link, index) => ({
    top: link.offsetTop,
    height: link.offsetHeight,
    fallbackTop: index * MOBILE_MENU_ROW_HEIGHT,
    fallbackHeight: MOBILE_MENU_ROW_VISIBLE_HEIGHT
  }));
  const measuredHeight = siteNav.scrollHeight;
  const estimatedHeight =
    MOBILE_MENU_TOP_PADDING +
    MOBILE_MENU_BOTTOM_PADDING +
    siteNavLinks.length * MOBILE_MENU_ROW_VISIBLE_HEIGHT +
    MOBILE_MENU_FIRST_ROW_MARGIN +
    Math.max(siteNavLinks.length - 1, 0) * MOBILE_MENU_ROW_MARGIN;
  const hasUsableMetrics =
    measuredHeight > MOBILE_MENU_ROW_VISIBLE_HEIGHT * 3 &&
    measuredMetrics.some((metric) => metric.height > 0);

  mobileMenuLinkMetrics = measuredMetrics.map((metric) => ({
    top: hasUsableMetrics && metric.height > 0 ? metric.top : metric.fallbackTop,
    height: hasUsableMetrics && metric.height > 0 ? metric.height : metric.fallbackHeight
  }));
  mobileMenuOpenHeight = hasUsableMetrics ? Math.max(measuredHeight, estimatedHeight) : estimatedHeight;

  siteHeader.style.setProperty("--mobile-menu-open-height", `${mobileMenuOpenHeight}px`);
  siteHeader.style.setProperty("--mobile-menu-current-height", `${mobileMenuOpenHeight}px`);

  siteNav.style.maxHeight = previousInlineMaxHeight;
  siteNav.style.opacity = previousInlineOpacity;
  siteNav.style.transform = previousInlineTransform;
  siteNav.style.pointerEvents = previousInlinePointerEvents;
  siteNav.style.overflow = previousInlineOverflow;

  if (!wasOpen) {
    siteNav.classList.remove("open");
  }

  siteHeader.style.setProperty("--mobile-menu-progress", `${previousProgress}`);
}

function invalidateMobileMenuMetrics() {
  mobileMenuOpenHeight = 0;
  mobileMenuLinkMetrics = [];
}

function isMobileMenuOpen() {
  return window.innerWidth <= 760 && !!siteNav?.classList.contains("open");
}

function updateBodyScrollLock() {
  const modalOpen = !!modal && !modal.classList.contains("hidden");
  document.body.style.overflow = modalOpen || isMobileMenuOpen() ? "hidden" : "";
}

function applyMobileMenuProgress(progress) {
  if (!siteHeader) {
    return;
  }

  siteHeader.style.setProperty("--mobile-menu-progress", `${progress}`);

  if (progress <= 0.001) {
    siteHeader.style.setProperty("--mobile-menu-current-height", "0px");
    siteNavLinks.forEach((link) => {
      link.style.setProperty("--menu-link-progress", "0");
    });
    return;
  }

  if (!mobileMenuOpenHeight || mobileMenuLinkMetrics.length !== siteNavLinks.length) {
    syncMobileMenuMetrics();
  }

  if (progress >= 0.999) {
    siteHeader.style.setProperty(
      "--mobile-menu-current-height",
      `${mobileMenuOpenHeight || siteNav?.scrollHeight || 0}px`
    );

    siteNavLinks.forEach((link) => {
      link.style.setProperty("--menu-link-progress", "1");
    });

    return;
  }

  const totalLinks = siteNavLinks.length;
  const collapse = 1 - progress;
  const dissolvePhase = collapse;
  let lastVisibleBottom = 0;

  siteNavLinks.forEach((link, index) => {
    const fromBottom = totalLinks - 1 - index;
    const start = fromBottom * 0.06;
    const end = Math.min(start + 0.46, 1);
    const rawLinkProgress =
      1 - Math.max(0, Math.min((dissolvePhase - start) / (end - start || 1), 1));
    const easedLinkProgress =
      rawLinkProgress * rawLinkProgress * (rawLinkProgress * (rawLinkProgress * 6 - 15) + 10);

    link.style.setProperty("--menu-link-progress", `${easedLinkProgress}`);

    const metrics = mobileMenuLinkMetrics[index];

    if (!metrics || easedLinkProgress <= 0.001) {
      return;
    }

    const visibleBottom = metrics.top + metrics.height * (0.42 + 0.58 * easedLinkProgress);
    lastVisibleBottom = Math.max(lastVisibleBottom, visibleBottom);
  });

  const currentHeight = Math.max(
    0,
    Math.min(mobileMenuOpenHeight, lastVisibleBottom + MOBILE_MENU_BOTTOM_PADDING + 8 * progress)
  );

  siteHeader.style.setProperty("--mobile-menu-current-height", `${currentHeight}px`);
}

function stopMobileMenuAnimation() {
  if (mobileMenuAnimationFrame !== null) {
    cancelAnimationFrame(mobileMenuAnimationFrame);
    mobileMenuAnimationFrame = null;
  }
}

function closeMobileMenu() {
  stopMobileMenuAnimation();
  siteNav?.classList.remove("open");
  siteHeader?.classList.remove("mobile-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  mobileMenuGestureOffset = 0;
  mobileMenuTouchY = null;
  mobileMenuProgress = 0;
  mobileMenuTargetProgress = 0;
  applyMobileMenuProgress(0);
  updateBodyScrollLock();
}

function animateMobileMenuProgress() {
  if (mobileMenuAnimationFrame !== null) {
    return;
  }

  const tick = () => {
    const delta = mobileMenuTargetProgress - mobileMenuProgress;

    if (Math.abs(delta) < 0.0015) {
      mobileMenuProgress = mobileMenuTargetProgress;
      applyMobileMenuProgress(mobileMenuProgress);
      mobileMenuAnimationFrame = null;

      if (mobileMenuProgress <= 0.01 && siteNav?.classList.contains("open")) {
        siteNav.classList.remove("open");
        siteHeader?.classList.remove("mobile-menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
        mobileMenuProgress = 0;
        mobileMenuTargetProgress = 0;
        applyMobileMenuProgress(0);
      }

      return;
    }

    // Ease toward the target for a softer liquid-glass feel.
    mobileMenuProgress += delta * 0.075;
    applyMobileMenuProgress(mobileMenuProgress);
    mobileMenuAnimationFrame = requestAnimationFrame(tick);
  };

  mobileMenuAnimationFrame = requestAnimationFrame(tick);
}

function setMobileMenuTargetProgress(progress) {
  mobileMenuTargetProgress = Math.max(0, Math.min(progress, 1));

  if (window.innerWidth > 760) {
    mobileMenuProgress = 1;
    mobileMenuTargetProgress = 1;
    applyMobileMenuProgress(1);
    stopMobileMenuAnimation();
    return;
  }

  animateMobileMenuProgress();
}

function setMobileMenuGestureProgress(offset) {
  const clampedOffset = Math.max(0, Math.min(offset, MOBILE_MENU_COLLAPSE_DISTANCE));
  const rawProgress = 1 - clampedOffset / MOBILE_MENU_COLLAPSE_DISTANCE;
  const menuProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);

  mobileMenuGestureOffset = clampedOffset;
  stopMobileMenuAnimation();
  mobileMenuProgress = menuProgress;
  mobileMenuTargetProgress = menuProgress;
  applyMobileMenuProgress(menuProgress);

  if (clampedOffset >= MOBILE_MENU_COLLAPSE_DISTANCE - 0.5) {
    closeMobileMenu();
  }
}

function handleMobileMenuGestureDelta(deltaY) {
  if (!isMobileMenuOpen()) {
    return false;
  }

  setMobileMenuGestureProgress(mobileMenuGestureOffset + deltaY);
  return true;
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

  if (!content) {
    return;
  }

  modalKicker.textContent = content.kicker;
  modalTitle.textContent = content.title;
  modalBody.innerHTML = content.body.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

function openModal(key) {
  setModalContent(key);
  modal.classList.remove("hidden");
  updateBodyScrollLock();
}

function closeModal() {
  modal.classList.add("hidden");
  updateBodyScrollLock();
}

menuToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  siteHeader?.classList.toggle("mobile-menu-open", isOpen);

  if (isOpen && window.innerWidth <= 760) {
    syncMobileMenuMetrics();
    mobileMenuScrollAnchor = window.scrollY;
    mobileMenuGestureOffset = 0;
    mobileMenuTouchY = null;
    stopMobileMenuAnimation();
    mobileMenuProgress = 1;
    mobileMenuTargetProgress = 1;
    applyMobileMenuProgress(1);
    updateBodyScrollLock();
  } else if (!isOpen) {
    closeMobileMenu();
  }
});

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
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
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
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
  const collapseDistance = 120;
  const isScrolled = window.scrollY > collapseDistance;

  siteHeader.classList.toggle("mobile-scrolled", isMobile && isScrolled);

  if (!isMobile) {
    closeMobileMenu();
    stopMobileMenuAnimation();
    mobileMenuProgress = 1;
    mobileMenuTargetProgress = 1;
    applyMobileMenuProgress(1);
    mobileMenuScrollAnchor = 0;
    return;
  }

  if (isMobile && siteNav?.classList.contains("open")) {
    updateBodyScrollLock();
    return;
  }

  if (mobileMenuProgress <= 0.01) {
    stopMobileMenuAnimation();
    mobileMenuTargetProgress = 0;
    mobileMenuProgress = 0;
    applyMobileMenuProgress(0);
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

    closeMobileMenu();

    scrollToSection(targetId);
  });
});

updateUniverseBackground();
updateMobileHeaderState();
window.addEventListener("scroll", updateUniverseBackground, { passive: true });
window.addEventListener("scroll", updateMobileHeaderState, { passive: true });
window.addEventListener(
  "wheel",
  (event) => {
    if (handleMobileMenuGestureDelta(event.deltaY)) {
      event.preventDefault();
    }
  },
  { passive: false }
);
window.addEventListener(
  "touchstart",
  (event) => {
    if (!isMobileMenuOpen()) {
      mobileMenuTouchY = null;
      return;
    }

    mobileMenuTouchY = event.touches[0]?.clientY ?? null;
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (event) => {
    if (!isMobileMenuOpen()) {
      mobileMenuTouchY = null;
      return;
    }

    const currentY = event.touches[0]?.clientY;

    if (typeof currentY !== "number") {
      return;
    }

    if (mobileMenuTouchY === null) {
      mobileMenuTouchY = currentY;
      event.preventDefault();
      return;
    }

    const deltaY = mobileMenuTouchY - currentY;
    mobileMenuTouchY = currentY;
    handleMobileMenuGestureDelta(deltaY);
    event.preventDefault();
  },
  { passive: false }
);
window.addEventListener("touchend", () => {
  mobileMenuTouchY = null;
});
window.addEventListener("touchcancel", () => {
  mobileMenuTouchY = null;
});
window.addEventListener("resize", () => {
  invalidateMobileMenuMetrics();
  updateUniverseBackground();
  updateMobileHeaderState();
});
