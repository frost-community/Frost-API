const crypto = require('crypto');
const path = require('path');
const { MissingArgumentsError } = require('../errors');

class GeneralHelper {
	/**
	 * 設定ファイルを読み込みます
	 *
	 * @return {Object} JSONデータのパース結果
	*/
	static loadConfig() {
		try {
			return require(path.resolve('.configs/api-config.json'));
		}
		catch (err) {
			return null;
		}
	}

	static getStringSize(str) {
		return (new Blob([str], { type: 'text/plain' })).size;
	}

	static buildHash(text, algorithm) {
		if (text == null) {
			throw new MissingArgumentsError();
		}

		const sha256 = crypto.createHash(algorithm || 'sha256');
		sha256.update(text);

		return sha256.digest('hex');
	}

	static sortObject(sourceObject) {
		const array = Object.keys(sourceObject);
		array.sort();
		const sorted = {};

		for (const i of array) {
			sorted[i] = sourceObject[i];
		}

		return sorted;
	}

	/**
	 * 型情報を文字列で取得します
	 *
	 * @return {'Object'|'Array'|'String'|'Number'|'Boolean'|'Function'|'AsyncFunction'|'Error'|'Promise'|'GeneratorFunction'|'Symbol'|'Null'|'Undefined'}
	*/
	static getType(object) {
		return Object.prototype.toString.call(object).slice(8, -1);
	}

	static randomRange(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	static delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
module.exports = GeneralHelper;
