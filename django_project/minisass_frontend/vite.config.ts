import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material", "@mui/icons-material"],
          map: ["maplibre-gl"],
        },
      },
    },
  },
  base: isProd ? "/static/" : "/",
  root: "./src",
  publicDir: "../public",
  plugins: [
    tsconfigPaths(),
    react(),
    // Bundle analyzer — run with ANALYZE=true npm run build
    ...(process.env.ANALYZE
      ? [
          import("rollup-plugin-visualizer").then((m) =>
            m.visualizer({
              open: true,
              filename: "dist/stats.html",
              gzipSize: true,
            })
          ),
        ]
      : []),
  ],
  // server: !isProd
  //   ? {
  //       proxy: {
  //         "/static": "http://0.0.0.0:5000",
  //         "/authentication": "http://0.0.0.0:5000",
  //         "/monitor": "http://0.0.0.0:5000",
  //         "/admin": "http://0.0.0.0:5000",
  //       },
  //       host: "0.0.0.0",
  //       port: 5173,
  //       strictPort: true,
  //       origin: 'http://0.0.0.0:5173'
  //     }
  //   : undefined,
});
