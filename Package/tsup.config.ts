import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: {
    resolve: true,
    entry: ["src/index.ts"],
    compilerOptions: {
      declaration: true,
      emitDeclarationOnly: true,
      noEmit: false,
    },
  },
  entry: {
    index: "src/index.ts",
  },
  format: "cjs",
  splitting: true,
  esbuildOptions(options) {
    options.minifyIdentifiers = true;
    options.minifySyntax = true;
    options.minifyWhitespace = true;
    options.keepNames = false;
  },
  external: ["node:events", "ws"],
});
