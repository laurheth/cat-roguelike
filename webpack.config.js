const path = require('path');

// src and dist directories
const src='src';
const dist='game';

const target = {
    development: {
        mode: "development",
        minimize: false,
        name: "script.js",
        devtool: "inline-source-map"
    },
    production: {
        mode: "production",
        minimize: true,
        name: "script.js",
        devtool: false
    }
}

module.exports = (env, options)=>({
    mode: target[options.mode].mode,
    // Entrypoint in ./src/scripts/index.ts
    entry: `./src/index.ts`,
    devtool: target[options.mode].devtool,
    optimization: {
        minimize: target[options.mode].minimize
    },
    module: {
        rules: [
            // Use ts-loader for TypeScript
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    // Recognize both .ts and .js extensions
    resolve: {
        extensions: [ '.ts', '.js' ],
    },
    // Where to put the output
    output: {
        filename: target[options.mode].name,
        path: path.resolve(__dirname, dist),
    },
});
