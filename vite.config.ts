import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves this app at github.io/curato/, so assets need that
  // prefix there. Netlify (and any other host serving from the domain root)
  // sets NETLIFY=true during its build, so use root-relative paths instead.
  base: process.env.NETLIFY ? "/" : "/curato/",

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));