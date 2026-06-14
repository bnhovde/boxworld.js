// Minimal esbuild-based dev server for the in-repo example.
// Replaces the old webpack + postcss toolchain.
import esbuild from "esbuild";
import {
  cpSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const outdir = "dist-example";
const port = 2500;

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

// Static assets are fetched at runtime from `/assets/...`.
cpSync("example/assets", path.join(outdir, "assets"), { recursive: true });

// Inject the bundle + a tiny live-reload listener into the HTML.
const html = readFileSync("example/index.html", "utf8").replace(
  "</head>",
  [
    '  <link rel="stylesheet" href="/index.css" />',
    '  <script type="module" src="/index.js"></script>',
    "  <script>new EventSource('/esbuild').addEventListener('change', () => location.reload());</script>",
    "</head>",
  ].join("\n")
);
writeFileSync(path.join(outdir, "index.html"), html);

const ctx = await esbuild.context({
  entryPoints: ["example/index.ts"],
  bundle: true,
  outdir,
  format: "esm",
  sourcemap: true,
});

if (process.argv.includes("--build")) {
  await ctx.rebuild();
  await ctx.dispose();
  console.log(`Built example to ${outdir}/`);
} else {
  await ctx.watch();
  await ctx.serve({ servedir: outdir, port });
  console.log(`Example running at http://localhost:${port}`);
}
