// Checks that index.html still matches the Clean Your TV launcher:
// every studio setting is a documented theme key, every documented key is
// in the studio (or deliberately left out), and the studio's defaults match
// the launcher's config.xml.
//
// Usage: node tools/check-sync.mjs [path to cleanyourtv clone] [git ref]
// Defaults: ../cleanyourtv and origin/main (run `git fetch` there first).
import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { runInNewContext } from "vm";

const repo = process.argv[2] || new URL("../../cleanyourtv", import.meta.url).pathname;
const ref = process.argv[3] || "origin/main";
const show = path => execFileSync("git", ["-C", repo, "show", ref + ":" + path], { encoding: "utf8" });

// Defaults the studio leaves empty on purpose: upstream they hold the author's own TV apps.
const OWN_DEFAULTS = ["dock_apps", "hidden_apps", "live_tv_package"];

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const studio = [...html.matchAll(/\{ k: "([a-z0-9_]+)"/g)].map(m => m[1]);
const notTheme = JSON.parse(html.match(/var NOT_THEME = (\[[^\]]*\])/)[1]);
const DEF = runInNewContext("(" + html.match(/var DEF = (\{[\s\S]*?\n  \});/)[1] + ")");

// Keys from the first column of the table under "## Keys" in themes/README.md.
const keysSection = show("themes/README.md").split(/^## Keys$/m)[1].split(/^## /m)[0];
const documented = new Set();
for (const line of keysSection.split("\n")) {
  const cell = line.match(/^\| ([^|]+) \|/);
  if (cell) for (const k of cell[1].matchAll(/`([a-z0-9_]+)`/g)) documented.add(k[1]);
}

// Defaults from config.xml; keys without a resource are defaulted in Java and skipped.
const xml = show("launcher/app/src/main/res/values/config.xml"), launcher = {};
for (const m of xml.matchAll(/<(bool|integer|string|color) name="([a-z0-9_]+)"[^>]*>([^<]*)<\/\1>/g))
  launcher[m[2]] = m[1] === "bool" ? m[3] === "true" : m[1] === "integer" ? +m[3] : m[3];
for (const m of xml.matchAll(/<(string-array|integer-array) name="([a-z0-9_]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
  const items = [...m[3].matchAll(/<item>([^<]*)<\/item>/g)].map(x => x[1]);
  launcher[m[2]] = m[1] === "integer-array" ? items.map(Number) : items;
}

const problems = [];
studio.filter(k => !documented.has(k)).forEach(k => problems.push(`In the studio but not documented (renamed or removed?): ${k}`));
[...documented].filter(k => !studio.includes(k) && !notTheme.includes(k)).forEach(k => problems.push(`Documented but not in the studio: ${k}`));
Object.keys(DEF).forEach(k => {
  if (!(k in launcher) || OWN_DEFAULTS.includes(k)) return;
  const d = DEF[k], x = launcher[k];
  const empty = x === "" || (Array.isArray(x) && !x.length);
  if (JSON.stringify(d) !== JSON.stringify(x) && !(d === null && empty))
    problems.push(`Default differs: ${k} is ${JSON.stringify(d)} in the studio, ${JSON.stringify(x)} in the launcher`);
});

if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log(`In sync with ${ref}: ${studio.length} settings, ${documented.size} documented keys.`);
