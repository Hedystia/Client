import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: false,
  treeshake: true,
  clean: true,
  unbundle: true,
  outputOptions: { exports: "named" },
  deps: { neverBundle: ["bun"] },
});
