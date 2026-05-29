import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlDir = path.join(__dirname, "html");

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const inlineFormat = (text) =>
  escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inUl = false;
  let inOl = false;
  let inParagraph = false;

  const closeParagraph = () => {
    if (inParagraph) {
      html.push("</p>");
      inParagraph = false;
    }
  };

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      closeParagraph();
      closeLists();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeParagraph();
      closeLists();
      html.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeParagraph();
      closeLists();
      html.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeParagraph();
      closeLists();
      html.push(`<h1>${inlineFormat(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      closeParagraph();
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      closeParagraph();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    closeLists();
    if (!inParagraph) {
      html.push("<p>");
      inParagraph = true;
    } else {
      html.push("<br>");
    }
    html.push(inlineFormat(trimmed));
  }

  closeParagraph();
  closeLists();

  return html.join("\n");
}

function buildDocument(title, body) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --bg: #18130e;
        --card: #221a12;
        --text: #f2e8da;
        --muted: #c4b49a;
        --accent: #c9853a;
        --line: rgba(201, 133, 58, 0.28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.65;
      }
      main {
        max-width: 840px;
        margin: 0 auto;
        padding: 48px 28px 72px;
      }
      .sheet {
        background: var(--card);
        border: 1px solid var(--line);
        padding: 40px 36px;
      }
      h1, h2, h3 {
        color: var(--text);
        line-height: 1.2;
        margin: 0 0 16px;
      }
      h1 {
        font-size: 34px;
        margin-bottom: 8px;
      }
      h2 {
        font-size: 26px;
        color: var(--accent);
        margin-top: 28px;
      }
      h3 {
        font-size: 20px;
        margin-top: 24px;
      }
      p, li {
        font-size: 16px;
        color: var(--text);
      }
      p { margin: 0 0 14px; }
      ul, ol {
        margin: 0 0 16px 22px;
        padding: 0;
      }
      li { margin-bottom: 8px; }
      code, strong {
        color: var(--accent);
      }
      @media print {
        body { background: white; color: black; }
        main { max-width: none; padding: 0; }
        .sheet { border: none; padding: 0; }
        h2, code, strong { color: #8a5519; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="sheet">
        ${body}
      </section>
    </main>
  </body>
</html>`;
}

const entries = await readdir(__dirname);
const markdownFiles = entries.filter((entry) => /^\d{2}-.*\.md$/.test(entry)).sort();

for (const file of markdownFiles) {
  const source = await readFile(path.join(__dirname, file), "utf8");
  const titleLine = source.split(/\r?\n/).find((line) => line.startsWith("# ")) ?? file;
  const title = titleLine.replace(/^#\s+/, "").trim();
  const body = markdownToHtml(source);
  const html = buildDocument(title, body);
  const outputPath = path.join(htmlDir, file.replace(/\.md$/, ".html"));
  await writeFile(outputPath, html, "utf8");
}
