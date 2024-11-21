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
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/background.ts"),
        worker: resolve(__dirname, "src/background/worker.ts"),
        content: resolve(__dirname, "src/content/content.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  worker: {
    format: "es",
  },
})
