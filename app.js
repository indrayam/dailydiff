(function () {
  const SOURCE_LABELS = {
    x: "X",
    hn: "HN",
    web: "Web",
    github: "GitHub",
  };
  const INTEREST_LABELS = {
    ai: "AI",
    tesla: "Tesla",
    space: "Space",
    spacex: "Space",
    systems: "Systems",
    science: "Science",
  };

  const MASTHEAD_TITLE = "The Daily Diff";
  const MASTHEAD_TAGLINE = "True Signals in a sea of Noise";

  const state = {
    edition: null,
    source: "all",
    interest: "all",
  };

  function bylineAuthors(authors) {
    if (!authors || !authors.length) return "";
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(" and ");
    return authors[0] + " et al.";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadEdition() {
    // Default caching lets this reuse the <link rel="preload"> in index.html;
    // vercel.json makes the browser revalidate edition.json on every load.
    const response = await fetch("./edition.json");
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  }

  function renderMasthead(edition, visibleCount) {
    const date = new Date(edition.date + "T00:00:00");
    const dateLabel = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const count = visibleCount == null ? edition.stories.length : visibleCount;
    const countLabel = count + (count === 1 ? " Story" : " Stories");

    const mastheadDate = document.getElementById("masthead-date");
    mastheadDate.textContent = dateLabel;
    mastheadDate.dateTime = edition.date;
    document.getElementById("masthead-story-count").textContent = countLabel;

    const updated = document.getElementById("masthead-updated");
    if (updated) {
      const updatedAt = new Date();
      updated.textContent =
        "Updated " +
        updatedAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        });
      updated.dateTime = updatedAt.toISOString();
    }

    document.title = MASTHEAD_TITLE + " | " + MASTHEAD_TAGLINE;
    const colophon = document.getElementById("edition-colophon-date");
    if (colophon) colophon.textContent = dateLabel;
  }

  function filterLabel(id, labels) {
    if (labels[id]) return labels[id];
    return id
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function editionFilterChips(edition, field, labels) {
    const ids = [];
    (edition.stories || []).forEach(function (story) {
      const values = field === "interests" ? story.interests || [] : [story[field]];
      values.forEach(function (value) {
        if (value && ids.indexOf(value) === -1) ids.push(value);
      });
    });
    return [{ id: "all", label: "All" }].concat(
      ids.map(function (id) {
        return { id: id, label: filterLabel(id, labels) };
      })
    );
  }

  // Builds the filter buttons once per edition. Clicks update the existing
  // buttons in place (syncFilters) so keyboard focus stays on the button.
  function renderFilters() {
    const groups = [
      { mount: "source-filter-options", chips: editionFilterChips(state.edition, "source", SOURCE_LABELS), key: "source" },
      { mount: "interest-filter-options", chips: editionFilterChips(state.edition, "interests", INTEREST_LABELS), key: "interest" },
    ];
    groups.forEach(function (group) {
      const mount = document.getElementById(group.mount);
      mount.innerHTML = group.chips.map(function (chip) {
        return (
          '<button type="button" class="filter-btn" aria-pressed="false" data-filter="' +
          escapeHtml(chip.id) +
          '">' +
          escapeHtml(chip.label) +
          "</button>"
        );
      }).join("");
      mount.querySelectorAll(".filter-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state[group.key] = btn.getAttribute("data-filter");
          syncFilters();
          applyFilters();
        });
      });
    });
    syncFilters();
  }

  function syncFilters() {
    [
      { mount: "source-filter-options", text: "source-filter-text", value: state.source },
      { mount: "interest-filter-options", text: "interest-filter-text", value: state.interest },
    ].forEach(function (group) {
      const buttons = document.querySelectorAll("#" + group.mount + " .filter-btn");
      let label = "";
      buttons.forEach(function (btn, index) {
        const selected = btn.getAttribute("data-filter") === group.value;
        btn.classList.toggle("active", selected);
        btn.setAttribute("aria-pressed", String(selected));
        if (selected || (!label && index === 0)) label = btn.textContent;
      });
      const text = document.getElementById(group.text);
      if (text && label) text.textContent = label;
    });
  }

  function renderStory(story, type) {
    const classes = ["story", "is-" + type, "no-image"];
    const authors = bylineAuthors(story.authors);
    const sourceHref = story.source_url || "#";
    const sourceLabel = story.source_label || String(story.source || "").toUpperCase();
    const discuss = story.discuss_url
      ? '<span class="story-source-sep">·</span><a class="story-source-link" href="' +
        escapeHtml(story.discuss_url) +
        '" target="_blank" rel="noopener noreferrer">Discuss</a>'
      : "";
    const byline =
      (authors ? "By " + escapeHtml(authors) + '<span class="story-source-sep">·</span>' : "") +
      '<a class="story-source-link" href="' +
      escapeHtml(sourceHref) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(sourceLabel) +
      "</a>" +
      discuss;
    const body = (story.body || [])
      .map(function (p) {
        return "<p>" + escapeHtml(p) + "</p>";
      })
      .join("");
    const label =
      type === "lead"
        ? "Top Story"
        : type === "feature"
          ? "Featured"
          : story.kicker || (story.interests || [])[0] || "";
    const kicker = label ? '<div class="story-kicker">' + escapeHtml(label) + "</div>" : "";

    return (
      '<article class="' +
      classes.join(" ") +
      '" data-source="' +
      escapeHtml(story.source) +
      '" data-interests="' +
      escapeHtml((story.interests || []).join(" ")) +
      '">' +
      kicker +
      '<h2 class="story-headline"><a href="' +
      escapeHtml(sourceHref) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(story.headline) +
      "</a></h2>" +
      '<div class="story-byline">' +
      byline +
      "</div>" +
      (story.why_read ? '<p class="story-deck">' + escapeHtml(story.why_read) + "</p>" : "") +
      '<div class="story-body">' +
      body +
      "</div></article>"
    );
  }

  function renderStories(edition) {
    const mount = document.getElementById("stories");
    const topStories = edition.stories.filter(function (story) {
      return story.lead;
    });
    const featuredStories = edition.stories.filter(function (story) {
      return !story.lead && story.featured;
    });
    const standardStories = edition.stories.filter(function (story) {
      return !story.lead && !story.featured;
    });

    mount.innerHTML =
      '<section class="story-group top-stories" aria-label="Top Stories">' +
      topStories.map(function (story) { return renderStory(story, "lead"); }).join("") +
      "</section>" +
      '<section class="story-group featured-stories" aria-label="Featured Stories">' +
      featuredStories.map(function (story) { return renderStory(story, "feature"); }).join("") +
      "</section>" +
      '<section class="story-group standard-stories" aria-label="More Stories">' +
      standardStories.map(function (story) { return renderStory(story, "standard"); }).join("") +
      "</section>";
  }

  function announce(message) {
    const status = document.getElementById("edition-status");
    if (status) status.textContent = message;
  }

  function setEditionBusy(isBusy) {
    const sheet = document.getElementById("newspaper-sheet");
    if (sheet) sheet.setAttribute("aria-busy", String(isBusy));
  }

  function clearNoStoriesMessage() {
    const empty = document.getElementById("no-stories-message");
    const retry = document.getElementById("retry-edition");
    if (empty) {
      empty.hidden = true;
      empty.style.display = "none";
    }
    if (retry) {
      retry.hidden = true;
      retry.disabled = false;
    }
  }

  function showNoStoriesMessage(message, canRetry) {
    const empty = document.getElementById("no-stories-message");
    const copy = document.getElementById("no-stories-copy");
    const retry = document.getElementById("retry-edition");
    if (copy) copy.textContent = message;
    if (empty) {
      empty.hidden = false;
      empty.style.display = "block";
      empty.dataset.state = canRetry ? "error" : "empty";
    }
    if (retry) retry.hidden = !canRetry;
  }

  function applyFilters() {
    const cards = document.querySelectorAll("#stories .story");
    let visible = 0;
    cards.forEach(function (card) {
      const source = card.getAttribute("data-source");
      const interests = (card.getAttribute("data-interests") || "").split(/\s+/).filter(Boolean);
      const sourceOk = state.source === "all" || source === state.source;
      const interestOk = state.interest === "all" || interests.indexOf(state.interest) !== -1;
      if (sourceOk && interestOk) {
        card.removeAttribute("data-hidden");
        visible += 1;
      } else {
        card.setAttribute("data-hidden", "true");
      }
    });
    if (visible === 0) {
      showNoStoriesMessage("No stories match the selected filters in today's edition.", false);
      announce("No stories match the selected filters in today's edition.");
    } else {
      clearNoStoriesMessage();
      announce(visible + (visible === 1 ? " story" : " stories") + " shown.");
    }
    if (state.edition) renderMasthead(state.edition, visible);
  }

  function initMobileFilters() {
    const groups = document.querySelectorAll(".filter-group");
    groups.forEach(function (group) {
      const trigger = group.querySelector(".filter-mobile-trigger");
      if (!trigger) return;
      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        const isOpen = group.classList.contains("open");
        groups.forEach(function (other) {
          other.classList.remove("open");
          const otherTrigger = other.querySelector(".filter-mobile-trigger");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          group.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
    document.addEventListener("click", function () {
      groups.forEach(function (group) {
        if (!group.classList.contains("open")) return;
        group.classList.remove("open");
        const trigger = group.querySelector(".filter-mobile-trigger");
        if (!trigger) return;
        trigger.setAttribute("aria-expanded", "false");
        // A choice inside the closing dropdown hides the focused button;
        // return focus to the trigger instead of losing it.
        if (group.contains(document.activeElement) && document.activeElement !== trigger) trigger.focus();
      });
    });
    // Escape closes an open dropdown and returns focus to its trigger.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      groups.forEach(function (group) {
        if (!group.classList.contains("open")) return;
        group.classList.remove("open");
        const trigger = group.querySelector(".filter-mobile-trigger");
        if (!trigger) return;
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
        event.preventDefault();
      });
    });
  }

  initMobileFilters();

  const retryButton = document.getElementById("retry-edition");

  function initializeEdition() {
    if (retryButton) {
      retryButton.disabled = true;
      retryButton.textContent = "Retrying…";
    }
    state.edition = null;
    clearNoStoriesMessage();
    setEditionBusy(true);
    announce("Loading today's edition.");

    loadEdition()
      .then(function (edition) {
        state.edition = edition;
        renderMasthead(edition);
        renderFilters();
        renderStories(edition);
        applyFilters();
      })
      .catch(function (err) {
        console.error(err);
        showNoStoriesMessage(
          "Today's edition could not be loaded. Check your connection and try again.",
          true
        );
        announce("Today's edition could not be loaded. Try again.");
      })
      .finally(function () {
        setEditionBusy(false);
        if (retryButton) {
          retryButton.disabled = false;
          retryButton.textContent = "Try again";
        }
      });
  }

  if (retryButton) retryButton.addEventListener("click", initializeEdition);
  initializeEdition();
})();
