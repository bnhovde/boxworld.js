import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    // Engine stylesheet; esbuild inlines the @import-ed backpack/animations CSS.
    boxworld: "src/@core/styles.css",
  },
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  sourcemap: true,
  target: "es2019",
  outDir: "dist",
});
