module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
  ignorePatterns: [
    "node_modules/**/*",
    ".next/**/*",
    "out/**/*",
    "scripts/**/*",
  ],
};
