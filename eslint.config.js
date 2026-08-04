import js from "@eslint/js";

export default [
  {
    ignores: ["vendor/**", "node_modules/**", "bin/**", "img/**"],
  },
  js.configs.recommended,
  {
    files: ["app.js", "js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        console: "readonly",
        Image: "readonly",
        JSZip: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
];
