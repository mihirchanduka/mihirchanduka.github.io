const themeToggle = document.getElementById("theme-toggle");
const emailCopy = document.getElementById("email-copy");
const emailLink = document.getElementById("email-link");
const linkedinLink = document.getElementById("linkedin-link");
const githubLink = document.getElementById("github-link");

const links = {
  "link-1": "https://aresty.rutgers.edu/",
  "link-2": "https://www.nyc.gov/content/omb/pages/",
  "link-3": "https://devpost.com/software/brahma",
  "link-4": "https://github.com/mihirchanduka/RUHealthHacks",
  "link-5": "https://devpost.com/software/seis-to-seven",
  "link-6": "https://devpost.com/software/signsense-hyeclg",
  "link-7": "https://github.com/mihirchanduka/EKGuide",
  "link-8": "https://github.com/mihirchanduka/posterboxd",
  "link-9": "https://github.com/mihirchanduka/Optical-Flow-Anticheat",
};

const storedTheme =
  localStorage.getItem("theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");

if (storedTheme) {
  document.documentElement.setAttribute(
    "data-theme",
    storedTheme === "dark" ? "6" : storedTheme === "light" ? "2" : storedTheme,
  );
}

themeToggle.onclick = () => {
  let currentTheme = document.documentElement.getAttribute("data-theme");
  let targetTheme = "1";
  switch (currentTheme) {
    case "1":
      targetTheme = "2";
      break;
    case "2":
      targetTheme = "3";
      break;
    case "3":
      targetTheme = "4";
      break;
    case "4":
      targetTheme = "5";
      break;
    case "5":
      targetTheme = "6";
      break;
    case "6":
      targetTheme = "7";
      break;
  }
  document.documentElement.setAttribute("data-theme", targetTheme);
  localStorage.setItem("theme", targetTheme);
};

emailCopy.onmouseenter = () => {
  const root = document.querySelector(":root");
  root.style.setProperty("--copy-text", `" [+]"`);
};

emailCopy.onfocus = () => {
  const root = document.querySelector(":root");
  root.style.setProperty("--copy-text", `" [+]"`);
};

emailCopy.onclick = () => {
  navigator.clipboard.writeText("chandukamihir@proton.com");
  const root = document.querySelector(":root");
  root.style.setProperty("--copy-text", `" [COPIED]"`);
};

emailLink.onclick = () => {
  window.location.href = "mailto:chandukamihir@proton.com";
};

linkedinLink.onclick = () => {
  window.open("https://www.linkedin.com/in/mihirchanduka/", "_blank");
};

githubLink.onclick = () => {
  window.open("https://github.com/mihirchanduka", "_blank");
};

for (const [id, url] of Object.entries(links)) {
  const linkElement = document.getElementById(id);
  if (linkElement) {
    linkElement.onclick = () => {
      window.open(url, "_blank");
    };
  }
}
