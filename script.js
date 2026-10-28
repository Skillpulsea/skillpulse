
document.addEventListener("DOMContentLoaded", () => {
  // ==============================
  // FOOTER YEAR
  // ==============================
  const yearElement = document.querySelector("#year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // ==============================
  // MOBILE NAVIGATION
  // ==============================
  const menuToggle = document.querySelector("#menuToggle");
  const navLinks = document.querySelector("#navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
      });
    });
  }

  // ==============================
  // SELECT PROGRAM FROM PROGRAM CARD
  // ==============================
  const programSelect = document.querySelector(
    '#contact-form select[name="program"]'
  );

  const programLinks = document.querySelectorAll("[data-program]");

  programLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const selectedProgram = link.dataset.program;

      if (programSelect && selectedProgram) {
        const matchingOption = Array.from(programSelect.options).find(
          (option) => option.value === selectedProgram
        );

        if (matchingOption) {
          programSelect.value = selectedProgram;
        } else {
          programSelect.value = "Other";
        }
      }
    });
  });

  // ==============================
  // PHONE NUMBER VALIDATION
  // ==============================
  const phoneInput = document.querySelector("#phone");

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 10);

      phoneInput.setCustomValidity("");
    });

    phoneInput.addEventListener("blur", () => {
      const phone = phoneInput.value.trim();

      if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        phoneInput.setCustomValidity(
          "Enter a valid 10-digit Indian mobile number."
        );
      } else {
        phoneInput.setCustomValidity("");
      }
    });
  }

  // ==============================
  // CONTACT FORM / WHATSAPP
  // ==============================
  const contactForm = document.querySelector("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const status = document.querySelector("#formStatus");
      const submitButton = contactForm.querySelector(
        'button[type="submit"]'
      );

      const formData = new FormData(contactForm);

      const enquiry = {
        name: (formData.get("name") || "").toString().trim(),
        email: (formData.get("email") || "").toString().trim(),
        phone: (formData.get("phone") || "").toString().trim(),
        program: (formData.get("program") || "").toString().trim(),
        message: (formData.get("message") || "").toString().trim()
      };

      // Check required fields
      if (
        !enquiry.name ||
        !enquiry.email ||
        !enquiry.phone ||
        !enquiry.program ||
        !enquiry.message
      ) {
        if (status) {
          status.textContent = "Please fill in all required fields.";
        }
        return;
      }

      // Validate email
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(enquiry.email)) {
        if (status) {
          status.textContent = "Please enter a valid email address.";
        }
        return;
      }

      // Validate Indian mobile number
      if (!/^[6-9]\d{9}$/.test(enquiry.phone)) {
        if (status) {
          status.textContent =
            "Enter a valid 10-digit Indian mobile number.";
        }

        if (phoneInput) {
          phoneInput.setCustomValidity(
            "Enter a valid 10-digit Indian mobile number."
          );
          phoneInput.reportValidity();
        }

        return;
      }

      // Replace with your actual WhatsApp number.
      // Include country code 91, without + or spaces.
      const whatsappNumber = "919347927168";

      // Build enquiry message
      const whatsappMessage =
        "New Skill Pulse Enquiry\n\n" +
        "Name: " + enquiry.name + "\n" +
        "Email: " + enquiry.email + "\n" +
        "Contact Number: " + enquiry.phone + "\n" +
        "Program: " + enquiry.program + "\n" +
        "Message: " + enquiry.message;

      const whatsappURL =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(whatsappMessage);

      if (status) {
        status.textContent =
          "Opening WhatsApp. Please send the message to complete your enquiry.";
      }

      if (submitButton) {
        submitButton.disabled = true;
      }

      // Open WhatsApp directly from the submit action
      const whatsappWindow = window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
      );

      if (whatsappWindow) {
        if (status) {
          status.textContent =
            "WhatsApp opened. Please review and send your enquiry.";
        }
      } else {
        // Fallback if the browser blocks a new window
        window.location.href = whatsappURL;
      }

      if (submitButton) {
        submitButton.disabled = false;
      }
    });
  }
});
