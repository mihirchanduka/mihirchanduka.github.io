import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const rootDir = process.cwd();
const blogDir = path.join(rootDir, "blog");
const postsSourceDir = path.join(blogDir, "posts");
const previewsDir = path.join(blogDir, "previews");

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value) {
  return String(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDate(value) {
  if (!value) return null;
  const normalized =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00Z`
      : value;
  const date = new Date(normalized);
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value) {
  if (!value) return "";
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function stripMarkdown(input) {
  return String(input || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function defaultPreview(post) {
  const border = "+--------------------------------------+";
  const title = String(post.title || "UNTITLED")
    .toUpperCase()
    .slice(0, 36);
  const date = (post.formattedDate || "Undated").slice(0, 36);
  const summary = stripMarkdown(post.summary || "")
    .slice(0, 150)
    .match(/.{1,36}(\s|$)/g)
    ?.map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3) || ["No preview configured."];

  const lines = [
    border,
    `| ${title.padEnd(36)} |`,
    `| ${date.padEnd(36)} |`,
    border,
    ...summary.map((line) => `| ${line.padEnd(36)} |`),
    border,
    "",
    "Hover posts to preview linked artwork.",
  ];

  return lines.join("\n");
}

async function resolvePreview(data) {
  if (typeof data.preview_ascii === "string" && data.preview_ascii.trim()) {
    return data.preview_ascii.replace(/\r\n/g, "\n").trimEnd();
  }

  const previewFile = data.preview_file || data.preview;
  if (typeof previewFile !== "string" || !previewFile.trim()) return "";

  const sanitized = previewFile.trim().replace(/^\/+/, "");
  if (!sanitized || sanitized.includes("..")) {
    throw new Error(`Invalid preview file path "${previewFile}"`);
  }

  const fullPath = path.join(previewsDir, sanitized);
  try {
    const previewText = await fs.readFile(fullPath, "utf8");
    return previewText.replace(/\r\n/g, "\n").trimEnd();
  } catch (error) {
    // Preview file doesn't exist, return empty string
    return "";
  }
}

function postPage(post) {
  return `<!doctype html>
<html lang="en" data-theme="1">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(post.title)} | Blog</title>
    <meta name="description" content="${escapeHtml(post.summary)}" />
    <link rel="stylesheet" href="../blog.css" />
  </head>
  <body>
    <div class="post-page">
      <header class="post-header">
        <nav class="post-nav">
          <a href="/blog/">← All posts</a>
        </nav>
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <p class="post-date-line">${post.formattedDate || "Undated"}</p>
      </header>

      <article class="post-article">${post.html}</article>

      <footer class="post-bottom">
        <nav class="post-nav">
          <a href="/">← Home</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle-post" type="button">
          Theme
        </button>
      </footer>
    </div>
    <script src="../blog.js"></script>
  </body>
</html>
`;
}

function indexPage(posts) {
  const postRows = posts.length
    ? posts
        .map(
          (
            post,
          ) => `                    <!-- Post: ${escapeHtml(post.title)} -->
                    <div class="content-row">
                        <button class="content-link post-link" data-url="/blog/${encodeURIComponent(post.slug)}/">
                            <span class="button-label">${escapeHtml(post.title)}</span>
                            <span class="mobile-only">[↗]</span>
                        </button>
                    </div>
                    <div class="content-row post-meta-row">
                        <span class="post-date">${post.formattedDate || "Undated"}</span>
                    </div>
                    <div class="content-row post-excerpt-row">
                        <p>${escapeHtml(post.summary)}</p>
                    </div>
                    <div class="content-row content-row-empty"></div>`,
        )
        .join("\n\n")
    : `                    <div class="content-row post-excerpt-row">
                        <p>No posts yet. Add markdown files in blog/posts/</p>
                    </div>
                    <div class="content-row content-row-empty"></div>`;

  return `<!doctype html>
<html lang="en" data-theme="1">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Blog | Mihir Chanduka</title>
        <meta name="description" content="Posts by Mihir Chanduka" />
        <link rel="stylesheet" href="./blog.css" />
    </head>
    <body>
        <div class="outer-container">
            <div class="inner-container">
                <div class="content-container">
                    <div class="content-row">
                        <p><span>Blog</span></p>
                    </div>
                    <div class="content-row content-row-empty"></div>

${postRows}

                    <div class="content-row content-row-second-from-bottom">
                        <a class="home-link content-link" href="/">
                            <span class="button-label">Home</span>
                            <span class="mobile-only">[↗]</span>
                        </a>
                    </div>

                    <div class="content-row content-row-bottom">
                        <button id="theme-toggle" class="content-switch" type="button">
                            <span class="button-label no-mobile">Theme</span>
                            <span class="mobile-only">[⬏]</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script src="./blog.js"></script>
    </body>
</html>
`;
}

async function ensureDirs() {
  await fs.mkdir(blogDir, { recursive: true });
  await fs.mkdir(postsSourceDir, { recursive: true });
  await fs.mkdir(previewsDir, { recursive: true });
}

async function loadPosts() {
  const files = (await fs.readdir(postsSourceDir)).filter((name) =>
    name.endsWith(".md"),
  );
  const posts = [];
  const seenSlugs = new Map();

  for (const file of files) {
    const fullPath = path.join(postsSourceDir, file);
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = matter(raw);
    const filename = file.replace(/\.md$/, "");
    const slug = slugify(parsed.data.slug || filename);
    if (!slug) continue;
    if (seenSlugs.has(slug)) {
      throw new Error(
        `Duplicate blog slug "${slug}" in "${file}" and "${seenSlugs.get(slug)}"`,
      );
    }
    seenSlugs.set(slug, file);

    const title = parsed.data.title || filename;
    const summary =
      parsed.data.summary || stripMarkdown(parsed.content).slice(0, 140);
    const date = parsed.data.date || null;
    const preview = await resolvePreview(parsed.data);

    posts.push({
      slug,
      title,
      summary,
      date,
      preview,
      formattedDate: formatDate(date),
      html: marked.parse(parsed.content),
    });
  }

  posts.sort((a, b) => {
    const aTime = parseDate(a.date)?.getTime() || 0;
    const bTime = parseDate(b.date)?.getTime() || 0;
    return bTime - aTime;
  });

  return posts;
}

async function cleanGeneratedPostDirs(posts) {
  const keep = new Set(["posts", ...posts.map((post) => post.slug)]);
  const entries = await fs.readdir(blogDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (keep.has(entry.name)) continue;
    if (entry.name === "assets") continue;
    if (entry.name === "previews") continue;
    await fs.rm(path.join(blogDir, entry.name), {
      recursive: true,
      force: true,
    });
  }
}

async function writePosts(posts) {
  for (const post of posts) {
    const postDir = path.join(blogDir, post.slug);
    await fs.mkdir(postDir, { recursive: true });
    await fs.writeFile(
      path.join(postDir, "index.html"),
      postPage(post),
      "utf8",
    );
  }
}

async function writeIndex(posts) {
  await fs.writeFile(
    path.join(blogDir, "index.html"),
    indexPage(posts),
    "utf8",
  );
}

async function main() {
  await ensureDirs();
  const posts = await loadPosts();
  await cleanGeneratedPostDirs(posts);
  await writePosts(posts);
  await writeIndex(posts);
  process.stdout.write(`Generated ${posts.length} blog post page(s).\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
