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

const modalContent = {
  mission: {
    kicker: "Vulvastic Mission",
    title: "Reshaping the Way We Speak of the Vulva",
    body: [
      "Vulvaverse is a space dedicated to breaking down barriers of stigma and taboo. We foster significant body knowledge, ensuring the vulva is recognized for its unique beauty and distinguished from the vagina.",
      "Join us in celebrating a part of ourselves that is rich with stories, shaped by culture, yet entirely our own."
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
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

menuToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
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

updateUniverseBackground();
window.addEventListener("scroll", updateUniverseBackground, { passive: true });
window.addEventListener("resize", updateUniverseBackground);
