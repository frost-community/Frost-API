const assert = require('assert');
const config = require('../../src/helpers/loadConfig')();
const DbProvider = require('../../src/helpers/dbProvider');
const Db = require('../../src/helpers/db');
const routeTimeline = require('../../src/routes/general/timeline');

describe('General API', () => {
	describe('/general', () => {
		describe('/timeline', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
	});
});
