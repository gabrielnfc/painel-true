module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
  settings: {
    next: {
      rootDir: ".",
    },
  },
  ignorePatterns: [
    "node_modules/**/*",
    ".next/**/*",
    "out/**/*",
    "scripts/**/*",
    "public/**/*",
  ],
};
