
document.addEventListener("DOMContentLoaded", () => {
  const loginPanel = document.querySelector("#loginPanel");
  const dashboardPanel = document.querySelector("#dashboardPanel");
  const loginForm = document.querySelector("#loginForm");
  const loginStatus = document.querySelector("#loginStatus");
  const dashboardStatus = document.querySelector("#dashboardStatus");
  const logoutButton = document.querySelector("#logoutButton");
  const refreshButton = document.querySelector("#refreshButton");
  const searchInput = document.querySelector("#searchInput");
  const enquiriesTable = document.querySelector("#enquiriesTable");
  const totalCount = document.querySelector("#totalCount");

  let enquiries = [];

  document.querySelector("#year").textContent =
    new Date().getFullYear();

  function showLogin() {
    loginPanel.hidden = false;
    dashboardPanel.hidden = true;
  }

  function showDashboard() {
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers
      }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        result.message || "Request failed."
      );
      error.status = response.status;
      throw error;
    }

    return result;
  }

  function addCell(row, value) {
    const cell = document.createElement("td");

    // Use textContent to safely display enquiry text.
    cell.textContent =
      value === null || value === undefined || value === ""
        ? "—"
        : String(value);

    row.appendChild(cell);
  }

  function renderEnquiries() {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = enquiries.filter((item) => {
      const searchable = [
        item.name,
        item.email,
        item.phone,
        item.program,
        item.message
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });

    enquiriesTable.replaceChildren();
    totalCount.textContent = enquiries.length;

    if (filtered.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 7;
      cell.textContent = enquiries.length
        ? "No enquiries match your search."
        : "No enquiries submitted yet.";

      row.appendChild(cell);
      enquiriesTable.appendChild(row);
      return;
    }

    filtered.forEach((item) => {
      const row = document.createElement("tr");

      addCell(row, item.id);
      addCell(row, item.name);
      addCell(row, item.email);
      addCell(row, item.phone);
      addCell(row, item.program);
      addCell(row, item.message);
      addCell(row, item.created_at);

      enquiriesTable.appendChild(row);
    });
  }

  async function loadEnquiries() {
    refreshButton.disabled = true;
    dashboardStatus.textContent = "Loading enquiries...";

    try {
      const result = await apiRequest("/api/admin/enquiries");

      enquiries = result.enquiries || [];
      renderEnquiries();

      dashboardStatus.textContent =
        `Loaded ${enquiries.length} enquiry record(s).`;
    } catch (error) {
      if (error.status === 401) {
        showLogin();
        loginStatus.textContent =
          "Your session has ended. Please log in again.";
        return;
      }

      dashboardStatus.textContent =
        error.message || "Could not load enquiries.";
    } finally {
      refreshButton.disabled = false;
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
      document.querySelector("#username").value.trim();
    const password =
      document.querySelector("#password").value;
    const button =
      loginForm.querySelector('button[type="submit"]');

    button.disabled = true;
    loginStatus.textContent = "Signing in...";

    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      loginForm.reset();
      showDashboard();
      await loadEnquiries();
    } catch (error) {
      loginStatus.textContent =
        error.message || "Login failed.";
    } finally {
      button.disabled = false;
    }
  });

  refreshButton.addEventListener("click", loadEnquiries);

  searchInput.addEventListener("input", renderEnquiries);

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      await apiRequest("/api/admin/logout", {
        method: "POST"
      });

      enquiries = [];
      enquiriesTable.replaceChildren();
      searchInput.value = "";
      showLogin();
      loginStatus.textContent = "You have logged out.";
    } catch (error) {
      dashboardStatus.textContent =
        error.message || "Could not log out.";
    } finally {
      logoutButton.disabled = false;
    }
  });

  async function checkExistingSession() {
    try {
      const result = await apiRequest("/api/admin/session");

      if (result.authenticated) {
        showDashboard();
        await loadEnquiries();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  checkExistingSession();
});
