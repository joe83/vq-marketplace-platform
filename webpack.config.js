const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    target: "node",
    entry: './src/app.ts',
    output: {
        filename: 'vqmarketplace.js',
        path: path.resolve(__dirname, 'dist')
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: [ 'babel-loader' ]
            }, {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        // disable to see no errors
                        transpileOnly: true,
                    }
                }],
            }, 
        ]
    },
    /**
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                extractComments: {
                    condition: 'all',
                    banner: `ViciQloud UG (haftungsbeschränkt). Licence: MIT.`
                }
            })
        ]
    },
    */
    resolve: {
        extensions: [ '*', '.ts', '.js', '.json' ]
    }
};