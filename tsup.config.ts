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
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  keepNames: false,
  sourcemap: false,
  target: "esnext",
  platform: "node",
  external: ["node:events"],
});
