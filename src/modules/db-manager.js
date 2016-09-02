'use strict';

module.exports = (db) => {
	const instance = {db: db};

	/**
	 * ドキュメントを作成します
	 *
	 * @param  {string} collectionName コレクション名
	 * @param  {string} data
	 */
	instance.createAsync = async (collectionName, data) => await instance.db.collection(collectionName).insert(data);

	/**
	 * ドキュメントを検索して項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} option
	 * @param  {Object|null} document
	 */
	instance.findAsync = async (collectionName, query, option) => (await instance.db.collection(collectionName).findOne(query, option));

	/**
	 * ドキュメントを検索して複数の項目を取得します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} option
	 * @param  {Object[]|null} documents
	 */
	instance.findArrayAsync = async (collectionName, query, option) => (await instance.db.collection(collectionName).findMany(query, option)).toArray();

	/**
	 * ドキュメントを更新します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} data
	 * @param  {Boolean} isMany
	 */
	instance.updateAsync = async (collectionName, query, data, isMany) => {
		if (isMany == undefined)
			isMany = false;

		return await instance.db.collection(collectionName).update(query, {$set: {data}}, !isMany, isMany);
	};

	/**
	 * ドキュメントを削除します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 */
	instance.removeAsync = async (collectionName, query) => await instance.db.collection(collectionName).remove(query);

	return instance;
}
