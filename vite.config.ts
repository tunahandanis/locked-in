import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import { resolve } from "path"
import eslintPlugin from "vite-plugin-eslint"

export default defineConfig({
  plugins: [
    preact(),
    eslintPlugin({
      cache: false,
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["node_modules", "dist"],
      failOnError: true,
      failOnWarning: false,
    }),
  ],
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
        offscreen: resolve(__dirname, "src/offscreen.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
        summarizer: resolve(__dirname, "src/summarizer.ts"),
        guide: resolve(__dirname, "src/guide/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
})
