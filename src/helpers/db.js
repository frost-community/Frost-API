'use strict';

const dbConnector = require('./dbConnector');
const collections = require('./collections');
const Applications = collections.Applications;
const ApplicationAccess = collections.ApplicationAccess;
const AuthorizeRequests = collections.AuthorizeRequests;
const Posts = collections.Posts;
const Users = collections.Users;
const UserFollowings = collections.UserFollowings;

class DB {
	constructor(config) {
		if (config == null)
			throw new Error('missing arguments');

		this._config = config;
		this.dbProvider = null;
	}

	async connectAsync() {
		this.dbProvider = await dbConnector.connectApidbAsync(this._config);
	}

	get applications() {
		return new Applications(this, this._config);
	}

	get applicationAccess() {
		return new ApplicationAccess(this, this._config);
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
exports.DB = DB;
