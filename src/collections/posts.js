const CollectionBase = require('../modules/collectionBase');

class Posts extends CollectionBase {
	constructor(db, config) {
		super('posts', '../documentModels/post', db, config);
	}
}
module.exports = Posts;
