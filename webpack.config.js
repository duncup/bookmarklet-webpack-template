const path = require('path');
const webpack = require('webpack');
var UglifyJS = require("uglify-js");

// Modified for webpack v5: See https://stackoverflow.com/a/46920791/839595
class AssetToBookmarkletPlugin {
  pluginName = 'AssetToBookmarkletPlugin';

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.processAssets.tap({
        name: this.pluginName,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      }, (assets) => {
        var options = {
          mangle: {
            toplevel: true,
          },
          nameCache: {}
        };
        // Emit a new .bookmarklet
        for (const assetName in assets) {
          const asset = assets[assetName];
          var code = UglifyJS.minify({
            "index.js": asset.source()
          }, options);
          const content = 'javascript:' + encodeURIComponent('(function(){eval(atob("' + Buffer.from(code.code).toString('base64') + '"))})()');
          compilation.emitAsset(assetName + '.bookmarklet', new webpack.sources.RawSource(content))
        }
      });
    });
  };
}

module.exports = {
  entry: {
    index: [
      './src/index.js',
    ]
  },
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'web',
  module: {
    rules: [{
      test: /\.(png|jpg|gif)$/,
      use: [{
        loader: 'url-loader',
        // options: {limit: 0} // 0 = always inline resource
      }]
    }, {
      test: /\.css$/,
      use: ['style-loader', {
        loader: 'css-loader',
        // options: {minimize: true} // Minify CSS as well
      }]
    }, {
      test: /\.html$/i,
      loader: "html-loader",
      options: {
        minimize: true,
      },
    },]
  },
  plugins: [
    new AssetToBookmarkletPlugin()
  ]
}