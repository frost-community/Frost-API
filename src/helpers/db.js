'use strict';

const DbProvider = require('./dbProvider');
const collections = require('./collections');
const Applications = collections.Applications;
const ApplicationAccesses = collections.ApplicationAccesses;
const AuthorizeRequests = collections.AuthorizeRequests;
const Posts = collections.Posts;
const Users = collections.Users;
const UserFollowings = collections.UserFollowings;

class Db {
	constructor(config) {
		if (config == null)
			throw new Error('missing arguments');

		this._config = config;
		this.dbProvider = null;
	}

	async connectAsync() {
		this.dbProvider = await DbProvider.connectApidbAsync(this._config);
	}

	get applications() {
		return new Applications(this, this._config);
	}

	get applicationAccesses() {
		return new ApplicationAccesses(this, this._config);
	}

	get authorizeRequests() {
		return new AuthorizeRequests(this, this._config);
	}

	get posts() {
		return new Posts(this, this._config);
	}

	get users() {
		return new Users(this, this._config);
	}

	get userFollowings() {
		return new UserFollowings(this, this._config);
	}
}
module.exports = Db;
