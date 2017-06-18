'use strict';

const Applications = require('../collections/applications');
const ApplicationAccesses = require('../collections/applicationAccesses');
const AuthorizeRequests = require('../collections/authorizeRequests');
const Posts = require('../collections/posts');
const Users = require('../collections/users');
const UserFollowings = require('../collections/userFollowings');

class Db {
	constructor(config, dbProvider) {
		if (config == null || dbProvider == null) {
			throw new Error('missing arguments');
		}

		this._config = config;
		this.dbProvider = dbProvider;

		// collections
		this.applications = new Applications(this, this._config);
		this.applicationAccesses = new ApplicationAccesses(this, this._config);
		this.authorizeRequests = new AuthorizeRequests(this, this._config);
		this.posts = new Posts(this, this._config);
		this.users = new Users(this, this._config);
		this.userFollowings = new UserFollowings(this, this._config);
	}
}
module.exports = Db;
