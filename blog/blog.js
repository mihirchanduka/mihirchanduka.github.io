const themeToggle = document.getElementById("theme-toggle");

let storedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "6"
  : "1";

try {
  storedTheme = localStorage.getItem("theme") || storedTheme;
} catch (_error) {
  // Ignore private-mode/storage access errors.
}

document.documentElement.setAttribute("data-theme", storedTheme);

if (themeToggle) {
  themeToggle.setAttribute("aria-label", "Cycle color theme");

  themeToggle.onclick = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    let nextTheme = "1";

    switch (currentTheme) {
      case "1":
        nextTheme = "2";
        break;
      case "2":
        nextTheme = "3";
        break;
      case "3":
        nextTheme = "4";
        break;
      case "4":
        nextTheme = "5";
        break;
      case "5":
        nextTheme = "6";
        break;
      case "6":
        nextTheme = "7";
        break;
      case "7":
        nextTheme = "1";
        break;
      default:
        nextTheme = "1";
    }

    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (_error) {
      // Ignore private-mode/storage access errors.
    }
  };
}

// Handle post link clicks
const postLinks = document.querySelectorAll(".post-link[data-url]");
for (const link of postLinks) {
  link.addEventListener("click", () => {
    const url = link.dataset.url;
    if (url) {
      window.location.href = url;
    }
  });
}
