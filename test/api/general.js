'use strict';

const assert = require('assert');
const config = require('../../built/helpers/loadConfig')();
const DbProvider = require('../../built/helpers/dbProvider');
const Db = require('../../built/helpers/db');
const routeTimeline = require('../../built/routes/general/timeline');

describe('General API', () => {
	describe('/general', () => {
		describe('/timeline', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});
		});
	});
});
