/* ============================================================
   Applied — Job Application Tracker
   No dependencies. Data is stored in localStorage only.
   ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "applied.applications.v1";
  var THEME_KEY = "applied.theme.v1";
  var STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

  var $ = function (id) { return document.getElementById(id); };

  var form = $("application-form");
  var list = $("app-list");
  var emptyState = $("empty-state");
  var emptyMessage = $("empty-message");
  var sampleBtn = $("load-sample");
  var searchInput = $("search");
  var sortSelect = $("sort");
  var resultCount = $("result-count");
  var submitBtn = $("submit-btn");
  var cancelEditBtn = $("cancel-edit");
  var formHint = $("form-hint");
  var themeToggle = $("theme-toggle");
  var dialog = $("confirm-dialog");
  var dialogMessage = $("confirm-message");
  var dialogOk = $("confirm-ok");
  var dialogCancel = $("confirm-cancel");

  var applications = loadApplications();
  var editingId = null;
  var activeFilter = "all";
  var query = "";
  var sortBy = "newest";
  var confirmAction = null;

  /* --------------------------- storage --------------------------- */

  function loadApplications() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item === "object" && typeof item.company === "string" && typeof item.role === "string";
      }).map(function (item) {
        return {
          id: String(item.id || uid()),
          company: item.company,
          role: item.role,
          location: typeof item.location === "string" ? item.location : "",
          date: typeof item.date === "string" ? item.date : "",
          status: STATUSES.indexOf(item.status) !== -1 ? item.status : "Applied",
          url: typeof item.url === "string" ? item.url : "",
          notes: typeof item.notes === "string" ? item.notes : ""
        };
      });
    } catch (error) {
      console.warn("Could not read saved applications:", error);
      return [];
    }
  }

  function saveApplications() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
      formHint.textContent = "Storage is unavailable, so changes won't be saved after a refresh.";
      formHint.style.color = "var(--red)";
      console.warn("Could not save applications:", error);
    }
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  /* ---------------------------- helpers -------------------------- */

  function todayString() {
    var d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
  }

  function formatDate(value) {
    if (!value) return "No date";
    var parts = value.split("-");
    if (parts.length !== 3) return value;
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function safeUrl(value) {
    if (!value || !value.trim()) return null;
    try {
      var parsed = new URL(value.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
    } catch (error) {
      return null;
    }
  }

  function slug(status) {
    return "badge-" + status.toLowerCase();
  }

  function clearErrors() {
    $("company-error").textContent = "";
    $("role-error").textContent = "";
    $("url-error").textContent = "";
  }

  function showDialog(message, action) {
    dialogMessage.textContent = message;
    confirmAction = action;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (window.confirm(message)) action();
  }

  /* ---------------------------- render --------------------------- */

  function visibleApplications() {
    var term = query.trim().toLowerCase();
    var filtered = applications.filter(function (item) {
      var matchesFilter = activeFilter === "all" || item.status === activeFilter;
      var haystack = (item.company + " " + item.role + " " + item.location).toLowerCase();
      return matchesFilter && (!term || haystack.indexOf(term) !== -1);
    });

    filtered.sort(function (a, b) {
      if (sortBy === "company") return a.company.localeCompare(b.company);
      var dateA = a.date || "";
      var dateB = b.date || "";
      return sortBy === "oldest" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

    return filtered;
  }

  function buildCard(item) {
    var card = document.createElement("article");
    card.className = "app-card";

    var top = document.createElement("div");
    top.className = "card-top";

    var headingWrap = document.createElement("div");
    var company = document.createElement("h3");
    company.className = "card-company";
    company.textContent = item.company;
    var role = document.createElement("p");
    role.className = "card-role";
    role.textContent = item.role;
    headingWrap.appendChild(company);
    headingWrap.appendChild(role);

    var badge = document.createElement("span");
    badge.className = "badge " + slug(item.status);
    badge.textContent = item.status;

    top.appendChild(headingWrap);
    top.appendChild(badge);
    card.appendChild(top);

    var meta = document.createElement("p");
    meta.className = "card-meta";
    [
      item.location || "Location not set",
      formatDate(item.date)
    ].forEach(function (text) {
      var span = document.createElement("span");
      span.textContent = text;
      meta.appendChild(span);
    });
    card.appendChild(meta);

    if (item.notes) {
      var notes = document.createElement("p");
      notes.className = "card-notes";
      notes.textContent = item.notes;
      card.appendChild(notes);
    }

    var actions = document.createElement("div");
    actions.className = "card-actions";

    var href = safeUrl(item.url);
    if (href) {
      var link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open job ↗";
      link.setAttribute("aria-label", "Open job posting for " + item.company);
      actions.appendChild(link);
    }

    var edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.dataset.id = item.id;
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", "Edit application at " + item.company);
    actions.appendChild(edit);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "action-danger";
    remove.dataset.action = "delete";
    remove.dataset.id = item.id;
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete application at " + item.company);
    actions.appendChild(remove);

    card.appendChild(actions);
    return card;
  }

  function render() {
    var visible = visibleApplications();
    list.replaceChildren.apply(list, visible.map(buildCard));

    var hasAny = applications.length > 0;
    emptyState.hidden = visible.length > 0;
    sampleBtn.hidden = !hasAny || Boolean(query.trim()) || activeFilter !== "all";

    if (!hasAny) {
      emptyMessage.textContent = "Add your first application above, or load a few sample entries to see how it works.";
    } else if (!visible.length) {
      emptyMessage.textContent = "No applications match this search or filter. Try a different status or clear the search.";
    }

    resultCount.textContent = visible.length === 1
      ? "1 application shown"
      : visible.length + " applications shown";

    $("stat-total").textContent = String(applications.length);
    $("stat-interview").textContent = String(applications.filter(function (a) { return a.status === "Interview"; }).length);
    $("stat-offer").textContent = String(applications.filter(function (a) { return a.status === "Offer"; }).length);
    $("stats-live").textContent =
      applications.length + " total applications, " +
      applications.filter(function (a) { return a.status === "Interview"; }).length + " interviews, " +
      applications.filter(function (a) { return a.status === "Offer"; }).length + " offers.";
  }

  /* ---------------------------- actions -------------------------- */

  function resetForm() {
    form.reset();
    editingId = null;
    submitBtn.textContent = "Add application";
    cancelEditBtn.hidden = true;
    formHint.textContent = "";
    formHint.style.color = "var(--green)";
    $("date").value = todayString();
    $("status").value = "Applied";
    clearErrors();
  }

  function startEdit(id) {
    var item = applications.find(function (a) { return a.id === id; });
    if (!item) return;

    resetForm();
    editingId = id;
    $("company").value = item.company;
    $("role").value = item.role;
    $("location").value = item.location;
    $("date").value = item.date;
    $("status").value = item.status;
    $("url").value = item.url;
    $("notes").value = item.notes;
    submitBtn.textContent = "Save changes";
    cancelEditBtn.hidden = false;
    formHint.textContent = "Editing " + item.company + ".";

    form.scrollIntoView({ behavior: "smooth", block: "start" });
    $("company").focus({ preventScroll: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    var company = $("company").value.trim();
    var role = $("role").value.trim();
    var urlValue = $("url").value.trim();
    var valid = true;

    if (!company) {
      $("company-error").textContent = "Company is required.";
      valid = false;
    }
    if (!role) {
      $("role-error").textContent = "Role is required.";
      valid = false;
    }
    var href = "";
    if (urlValue) {
      href = safeUrl(urlValue);
      if (!href) {
        $("url-error").textContent = "Use a full link starting with https://";
        valid = false;
      }
    }
    if (!valid) return;

    var data = {
      company: company,
      role: role,
      location: $("location").value.trim(),
      date: $("date").value,
      status: $("status").value,
      url: href,
      notes: $("notes").value.trim()
    };

    var wasEditing = Boolean(editingId);

    if (editingId) {
      var index = applications.findIndex(function (a) { return a.id === editingId; });
      if (index !== -1) {
        data.id = editingId;
        applications[index] = data;
      }
    } else {
      data.id = uid();
      applications.push(data);
    }

    saveApplications();
    resetForm();
    formHint.textContent = wasEditing ? "Changes saved for " + company + "." : "Added " + company + ". Track it below.";
    render();
  }

  function handleListClick(event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var id = button.dataset.id;

    if (button.dataset.action === "edit") {
      startEdit(id);
      return;
    }

    if (button.dataset.action === "delete") {
      var item = applications.find(function (a) { return a.id === id; });
      if (!item) return;
      showDialog("Delete the application at " + item.company + "? This cannot be undone.", function () {
        applications = applications.filter(function (a) { return a.id !== id; });
        if (editingId === id) resetForm();
        saveApplications();
        render();
      });
    }
  }

  function loadSample() {
    var samples = [
      { company: "Northstar Studio", role: "Junior Frontend Developer", location: "Hyderabad · Hybrid", date: "2026-10-14", status: "Interview", url: "", notes: "Sample entry — portfolio shortlist call scheduled." },
      { company: "Civic Labs", role: "Web Development Intern", location: "Remote", date: "2026-10-08", status: "Applied", url: "", notes: "Sample entry — follow up after 7 days." },
      { company: "Brightgrid", role: "Frontend Engineer, Graduate", location: "Bengaluru", date: "2026-09-29", status: "Offer", url: "", notes: "Sample entry — offer received, reviewing." },
      { company: "Meridian Systems", role: "Software Trainee", location: "Chennai", date: "2026-09-20", status: "Rejected", url: "", notes: "Sample entry — asked for feedback for next time." }
    ];
    applications = samples.map(function (item) {
      item.id = uid();
      return item;
    });
    saveApplications();
    render();
    formHint.textContent = "Sample data loaded. Edit or delete these entries freely.";
  }

  function exportCsv() {
    if (!applications.length) {
      formHint.textContent = "Add at least one application before exporting.";
      return;
    }
    var header = ["Company", "Role", "Location", "Date applied", "Status", "Notes", "Job link"];
    var rows = applications.map(function (a) {
      return [a.company, a.role, a.location, a.date, a.status, a.notes, a.url];
    });
    var csv = [header].concat(rows).map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\r\n");

    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "applications-" + todayString() + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    formHint.textContent = "Exported " + applications.length + " applications to CSV.";
  }

  /* ----------------------------- theme --------------------------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (error) { saved = null; }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved === "dark" || saved === "light" ? saved : (prefersDark ? "dark" : "light"));
  }

  /* ----------------------------- events -------------------------- */

  form.addEventListener("submit", handleSubmit);
  cancelEditBtn.addEventListener("click", function () {
    resetForm();
    formHint.textContent = "Edit cancelled.";
  });
  list.addEventListener("click", handleListClick);
  sampleBtn.addEventListener("click", loadSample);
  $("export-btn").addEventListener("click", exportCsv);

  $("clear-btn").addEventListener("click", function () {
    if (!applications.length) {
      formHint.textContent = "There is nothing to clear.";
      return;
    }
    showDialog("Delete all " + applications.length + " applications? This cannot be undone.", function () {
      applications = [];
      resetForm();
      saveApplications();
      render();
      formHint.textContent = "All applications cleared.";
    });
  });

  searchInput.addEventListener("input", function (event) {
    query = event.target.value;
    render();
  });

  sortSelect.addEventListener("change", function (event) {
    sortBy = event.target.value;
    render();
  });

  Array.prototype.forEach.call(document.querySelectorAll(".chip[data-filter]"), function (chip) {
    chip.addEventListener("click", function () {
      activeFilter = chip.dataset.filter;
      Array.prototype.forEach.call(document.querySelectorAll(".chip[data-filter]"), function (other) {
        var isActive = other === chip;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-pressed", String(isActive));
      });
      render();
    });
  });

  themeToggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* non-fatal */ }
  });

  dialogCancel.addEventListener("click", function () {
    confirmAction = null;
    if (typeof dialog.close === "function") dialog.close();
  });

  dialogOk.addEventListener("click", function () {
    var action = confirmAction;
    confirmAction = null;
    if (typeof dialog.close === "function") dialog.close();
    if (typeof action === "function") action();
  });

  dialog.addEventListener("cancel", function () { confirmAction = null; });

  /* ------------------------------ init --------------------------- */

  initTheme();
  resetForm();
  render();
})();
