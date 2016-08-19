'use strict';

const fs = require('fs');

/**
 * 設定ファイルを読み込みます
 *
 * @return {Object} JSONデータのパース結果
 */
var load = () => {
	return JSON.parse(fs.readFileSync(__dirname + '/../../config.json', 'utf8'));
}
module.exports = load;
