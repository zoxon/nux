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
  splitting: false,
  treeshake: true,
  target: "es2020",
  esbuildOptions(options, context) {
    if (context.format === "esm") {
      options.outExtension = { ".js": ".mjs" };
    }
    if (context.format === "cjs") {
      options.outExtension = { ".js": ".cjs" };
    }
  },
});
