module.exports = {
  presets: [require.resolve("@docusaurus/core/lib/babel/preset")],
  plugins: ["transform-inline-environment-variables"],
};
