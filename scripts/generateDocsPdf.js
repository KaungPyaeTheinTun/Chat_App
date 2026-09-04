const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const readmePath = path.join(rootDir, "README.md");
const docsDir = path.join(rootDir, "docs");
const outputPath = path.join(docsDir, "ChatApp-Documentation.pdf");

const escapePdfText = (value) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const normalizeMarkdownLine = (line) =>
  line
    .replace(/^#{1,6}\s*/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

const wrapLine = (line, width = 92) => {
  if (!line.trim()) {
    return [""];
  }

  const words = line.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const buildPages = (text) => {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.flatMap((line) =>
    wrapLine(normalizeMarkdownLine(line)),
  );
  const pages = [];
  const linesPerPage = 48;

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return pages;
};

const buildContentStream = (lines) => {
  const commands = ["BT", "/F1 10 Tf", "50 760 Td", "14 TL"];
  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("T*");
    }
    commands.push(`(${escapePdfText(line)}) Tj`);
  });
  commands.push("ET");
  return commands.join("\n");
};

const buildPdf = (pages) => {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const pageRefs = [];
  let objectId = 4;

  pages.forEach((pageLines) => {
    const pageId = objectId++;
    const contentId = objectId++;
    const stream = buildContentStream(pageLines);
    pageRefs.push(`${pageId} 0 R`);
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${
    pageRefs.length
  } >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, "utf8");
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
};

fs.mkdirSync(docsDir, { recursive: true });
const readme = fs.readFileSync(readmePath, "utf8");
const pages = buildPages(readme);
fs.writeFileSync(outputPath, buildPdf(pages), "binary");

console.log(`PDF documentation created: ${outputPath}`);
