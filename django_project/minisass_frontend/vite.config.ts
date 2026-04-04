import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import reactRefresh from "@vitejs/plugin-react-refresh";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  build: { manifest: true },
  base: isProd ? "/static/" : "/",
  root: "./src",
  publicDir: "../public",
  plugins: [tsconfigPaths(), react()],
  // server: !isProd
  //   ? {
  //       proxy: {
  //         "/static": "http://0.0.0.0:5000",
  //         "/authentication": "http://0.0.0.0:5000",
  //         "/monitor": "http://0.0.0.0:5000",
  //         "/admin": "http://0.0.0.0:5000",
  //       },
  //       host: "0.0.0.0", // or use "0.0.0.0" for LAN access
  //       port: 5173,
  //       strictPort: true,
  //       origin: 'http://0.0.0.0:5173'
  //     }
  //   : undefined,
});
