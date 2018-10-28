import { join } from "path";
import { writeFileSync } from "fs";
import fetch from "node-fetch";
import { load } from "cheerio";
import * as TurndownService from "turndown";

const LIBS_DIR = join(__dirname, "../library-docs");

const turndownService = new TurndownService();
turndownService.addRule("examplesTable", {
  filter: ["table"],
  replacement: (content, node) => _tableNodeToMarkdown(node),
});

async function fetchLibFromUrl(url: string) {
  try {
    const html = await _fetchHtml(url);

    const library = _parseLibrary(html);

    const path = _writeLibraryToFile(library);

    console.log(`Library written to ${path}`);
  } catch (error) {
    console.error(`Unable to fetch library from URL ${url}`);
    console.error(error);
    process.exit(2);
  }
}

async function _fetchHtml(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Unable to fetch library from URL ${url}`);
    console.error(`Invalid response ${response.status} ${response.statusText}`);
    process.exit(2);
  }

  return await response.text();
}

function _parseLibrary(html: string) {
  const $ = load(html);
  const libraryJsonString = $(
    "script[type='text/javascript']:contains('libdoc =')"
  )
    .html()
    .slice(9, -2)
    .replace(/\\x3c/g, "<");

  const libraryData = JSON.parse(libraryJsonString);

  const keywords = _parseKeywords(libraryData.keywords);

  return {
    name: libraryData.name,
    version: libraryData.version,
    keywords,
  };
}

function _parseKeywords(keywords) {
  return keywords.map(kw => ({
    name: kw.name,
    args: kw.args,
    doc: _parseDocumentation(kw.doc),
  }));
}

function _parseDocumentation(documentation: string) {
  const parsed = turndownService.turndown(documentation);

  return parsed;
}

function _tableNodeToMarkdown(node) {
  const rowContents = [];
  const rows = node.rows;

  for (let i = 0; i < rows.length; i++) {
    const row = rows.item(i);

    const cells = row.cells;
    const cellContents = [];
    for (let j = 0; j < cells.length; j++) {
      const cell = cells.item(j);
      cellContents.push(cell.textContent);
    }

    rowContents.push(cellContents.join("  "));
  }

  return ["```", ...rowContents, "```"].join("\n");
}

function _writeLibraryToFile(library) {
  const libraryFilename = `${library.name}-${library.version}.json`;
  const libraryFilePath = join(LIBS_DIR, libraryFilename);

  writeFileSync(libraryFilePath, JSON.stringify(library));

  return libraryFilePath;
}

const libUrl = process.argv[process.argv.length - 1];
if (!libUrl.startsWith("http")) {
  console.log(`Invalid URL given ${libUrl}`);
  process.exit(1);
}

fetchLibFromUrl(libUrl);
