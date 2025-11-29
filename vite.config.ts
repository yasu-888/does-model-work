/** @format */

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: "./src/client.tsx",
      output: {
        entryFileNames: "client.js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  plugins: [
    tailwindcss(),
    devServer({
      entry: "src/app.tsx",
    }),
  ],
  server: {
    host: "0.0.0.0",
  },
});
