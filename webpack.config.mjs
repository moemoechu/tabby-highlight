import * as path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export default () => ({
  target: "node",
  entry: "src/index.ts",
  devtool: "source-map",
  context: __dirname,
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    pathinfo: true,
    libraryTarget: "umd",
    devtoolModuleFilenameTemplate: "webpack-tabby-highlight:///[resource-path]",
  },
  resolve: {
    modules: [".", "src", "node_modules"].map((x) => path.join(__dirname, x)),
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve(__dirname, "tsconfig.json"),
        },
      },
      {
        test: /\.scss/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {
              esModule: false,
            },
          },
        ],
      },
      {
        test: /\.po$/,
        use: [{ loader: "json-loader" }, { loader: "po-gettext-loader" }],
      },
    ],
  },
  externals: ["fs", "ngx-toastr", /^rxjs/, /^@angular/, /^@ng-bootstrap/, /^tabby-/],
});
