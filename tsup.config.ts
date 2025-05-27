import { defineConfig } from "tsup";

const entries = [
  "src/index.ts",
  "src/integrations/astro/index.ts",
  "src/integrations/vanilla/index.ts"
]

export default defineConfig({
  entry: entries,
  outDir: "dist",
  format: ["esm", "cjs"],
  minify: true,
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  target: "es2020",
});
