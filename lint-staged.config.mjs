export default {
  "*.{ts,mts,cts,mjs,cjs,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yaml,yml,html,css}": "prettier --write",
};
