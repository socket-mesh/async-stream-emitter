import * as path from 'path';
import * as webpack from 'webpack';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
			{
				test: /\.m?js/,
				resolve: {
					fullySpecified: false
				}
			}
    ]
  },
	resolve: {
		extensions: ['.ts', '.js']
	},
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'async-stream-emitter.js',
  },
};

export default config;