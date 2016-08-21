'use strict';

module.exports = (db) => {
	const instance = {db: db};

	/**
	 * ドキュメントを作成します
	 *
	 * @param  {string} collectionName コレクション名
	 * @param  {string} data
	 */
	var create = (collectionName, data) => new Promise((resolve, reject) => {
		instance.db[collectionName].insert(data);
	});
	instance.create = create;

	/**
	 * ドキュメントを検索します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} projection
	 */
	var find = (collectionName, query, projection) => {
		instance.db[collectionName].find(query, projection);
	};
	instance.find = find;

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} data
	 * @param  {Boolean} isMany
	 */
	var update = (collectionName, data, isMany) => new Promise((resolve, reject) => {
		if (isMany == undefined)
			isMany = false;

		instance.db[collectionName].update(data, {$set: {data}}, !isMany, isMany);
	});
	instance.update = update;

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 */
	var remove = (collectionName, query) => {
		instance.db[collectionName].remove(query);
	};
	instance.remove = remove;

	return instance;
}
