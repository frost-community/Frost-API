'use strict';

const fs = require('fs');

/**
 * 設定ファイルを読み込みます。
 * リポジトリ直下ディレクトリか、その１つ上層のディレクトリからconfig.jsonを読み込むことができます。
 * リポジトリ直下ディレクトリのconfig.jsonから優先的に読み込まれます。
 *
 * @return {Object} JSONデータのパース結果
 */
module.exports = () => {
	if (fs.existsSync(`${process.cwd()}/config.json`))
		return require(`${process.cwd()}/config.json`);
	else if (fs.existsSync(`${process.cwd()}/../config.json`))
		return require(`${process.cwd()}/../config.json`);
	else
		return null;
};
