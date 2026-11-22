// Inlines the production build (dist/) into self-contained HTML so the demo runs without Node or a server.
// Usage: npm run build && node scripts/make-standalone.cjs
//   → ../Demo_Standalone.html   full document: double-click to open in Chrome or Edge (works offline except the web font)
//   → ../Demo_Standalone.artifact.html   same app without <html>/<head>/<body>, for hosting as a claude.ai Artifact
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const dist = path.join(ROOT, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const css = [...html.matchAll(/<link[^>]+href="\.?\/?(assets\/[^"]+\.css)"[^>]*>/g)].map((m) => fs.readFileSync(path.join(dist, m[1]), "utf8")).join("\n");
const js = [...html.matchAll(/<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"[^>]*><\/script>/g)].map((m) => fs.readFileSync(path.join(dist, m[1]), "utf8")).join("\n");
if (!css || !js) throw new Error("dist/ not found or unexpected index.html: run npm run build first");
const safeJs = js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
const title = "Country Delight Assistant Demo";
const font = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">';
const body = `<div id="root"></div>\n<script type="module">\n${safeJs}\n</script>`;
const full = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n<title>${title}</title>\n<meta name="description" content="Interactive prototype of the Country Delight app with a Graine AI assistance layer. Simulated data and back end.">\n${font}\n<style>\n${css}\n</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const fragment = `<title>${title}</title>\n${font}\n<style>\n${css}\n</style>\n${body}\n`;
fs.writeFileSync(path.join(ROOT, "..", "Demo_Standalone.html"), full);
fs.writeFileSync(path.join(ROOT, "..", "Demo_Standalone.artifact.html"), fragment);
console.log(`Demo_Standalone.html ${(full.length / 1024).toFixed(0)} KB; artifact fragment ${(fragment.length / 1024).toFixed(0)} KB`);
