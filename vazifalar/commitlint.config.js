// commitlint.config.js — commit xabari qoidalari (16/#40, Conventional
// Commits): "tur: qisqa tavsif" — feat, fix, refactor, chore, docs,
// test... Tavsif o'zbekcha, tur nomlari — standartdagidek inglizcha
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Sarlavha ≤ 72 belgi (kanon 2.4: git log --oneline va GitHub'da
    // kesilmaydi); config-conventional da 100
    "header-max-length": [2, "always", 72],
    // Tavsif katta harf bilan boshlanmasin — inglizcha uchun yaxshi,
    // bizda esa nom bilan boshlanadi: "ESLint ...", "PWA ...",
    // "Natija (Result) ..." (12–15-qism commit'larining 7 tasi shu
    // qoida bilan yiqildi — o'lchandi). O'chiramiz
    "subject-case": [0],
  },
};
