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
	 * ドキュメントを検索します
	 *
	 * @param  {string} collectionName
	 * @param  {Object} query
	 * @param  {Object} projection
	 * @param  {Object[]|null} documents
	 */
	instance.findArrayAsync = async (collectionName, query, projection) => (await instance.db.collection(collectionName).find(query, projection)).toArray();

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
