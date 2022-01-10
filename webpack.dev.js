const webpackCommon = require("./webpack.shared");
const path = require("path");

module.exports = {
  ...webpackCommon,
  devtool: "inline-source-map",
  mode: "development",
  devServer: {
    static: path.join(__dirname, "dist"),
    port: 2500,
  },
};
