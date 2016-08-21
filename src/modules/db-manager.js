'use strict';

const log = require('./log');

module.exports = (db) => {
	const instance = {db: db};

	/**
	 * ドキュメントを作成します
	 *
	 * @param  {string} collectionName コレクション名
	 * @param  {string} data
	 */
	var createAsync = (async (collectionName, data) => {
		return await instance.db.collection(collectionName).insert(data);
	});
	instance.createAsync = createAsync;

	/**
	 * ドキュメントを検索します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} projection
	 * @param  {Object[]|null} documents
	 */
	var findArrayAsync = (async (collectionName, query, projection) => {
		var items = await instance.db.collection(collectionName).find(query, projection);
		return await items.toArray();
	});
	instance.findArrayAsync = findArrayAsync;

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} data
	 * @param  {Boolean} isMany
	 */
	var updateAsync = (async (collectionName, data, isMany) => {
		if (isMany == undefined)
			isMany = false;

		return await instance.db.collection(collectionName).update(data, {$set: {data}}, !isMany, isMany);
	});
	instance.updateAsync = updateAsync;

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 */
	var removeAsync = (async (collectionName, query) => {
		return await instance.db.collection(collectionName).remove(query);
	});
	instance.removeAsync = removeAsync;

	return instance;
}
