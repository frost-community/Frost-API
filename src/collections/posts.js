'use strict';

const CollectionBase = require('../helpers/collectionBase');

class Posts extends CollectionBase {
	constructor(db, config) {
		super('posts', '../documentModels/post', db, config);
	}
}
module.exports = Posts;