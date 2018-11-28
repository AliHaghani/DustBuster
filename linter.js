const ESLint = require("eslint");

module.exports = {
  lint: (source) => {
    const linter = new ESLint.Linter();
    const cli = new ESLint.CLIEngine({
      extends: "eslint:recommended",
    });

    const config = cli.getConfigForFile("./.eslintrc.json")

    const messages = linter.verify(source, config);

    return messages;
  }
};

// lint(` var x; console.log(y) `)
