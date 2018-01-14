const assert = require('assert');
const { loadConfig } = require('../../src/modules/helpers/GeneralHelper');
const config = loadConfig();
const MongoAdapter = require('../../src/modules/MongoAdapter');
const UsersService = require('../../src/services/UsersService');
const ApplicationsService = require('../../src/services/ApplicationsService');
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
