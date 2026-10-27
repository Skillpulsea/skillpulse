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
          // If the clicked program is not in the dropdown,
          // select "Other" instead.
          programSelect.value = "Other";
        }
      }
    });
  });

  // ==============================
  // CONTACT FORM / BACKEND
  // ==============================
  const contactForm = document.querySelector("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
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
      if (!enquiry.name || !enquiry.email || !enquiry.message) {
        if (status) {
          status.textContent = "Please fill in all required fields.";
        }
        return;
      }

      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(enquiry.email)) {
        if (status) {
          status.textContent = "Please enter a valid email address.";
        }
        return;
      }
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

  phoneInput.addEventListener("change", () => {
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



      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      if (status) {
        status.textContent = "Submitting your enquiry...";
      }

      try {
        const response = await fetch("/api/enquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(enquiry)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to save your enquiry."
          );
        }

        if (status) {
          status.textContent =
            "Thank you! Your enquiry has been submitted successfully.";
        }

        contactForm.reset();

      } catch (error) {
        console.error("Enquiry submission error:", error);

        if (status) {
          status.textContent =
            error.message ||
            "Unable to submit your enquiry. Please try again.";
        }

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Submit Enquiry ↗";
        }
      }
    });
  }
});