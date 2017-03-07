'use strict';

const sinon = require('sinon');
const assert = require('assert');
const proxyquire = require('proxyquire');

describe('routes', () => {
	const routes = require('../built/routes')();

	it('存在するHTTPメソッドを利用している', () => {
		for(const route of routes) {
			let method = route[0];
			method = method.replace(/^del$/, 'delete');
			assert(require('methods').indexOf(method) > -1);
		}
	});

	it('権限リストにある権限名のみを利用している', () => {
		for(const route of routes) {
			if ('permissions' in route[2]) {
				for(const permission of route[2].permissions) {
					assert(require('../built/helpers/permission').permissionTypes.indexOf(permission) > -1);
				}
			}
		}
	});
});

describe('randomRange', () => {
	const random = require('../built/helpers/randomRange');

	it('範囲を指定して生成した乱数の値はその範囲内にある', () => {
		for(let i = 0; i < 1000; i++) {
			const value = random(64, 1024);
			assert(value >= 64 && value <= 1024);
		}
	});
});

describe('API', () => {
	describe('アカウントを作成する時', () => {
		it('正しくリクエストされた場合は成功する', (done) => {
			(async () => {
				try {
					const routeAccount = proxyquire('../built/routes/account', {
						'../helpers/dbConnector': () => {
							return {
								connectApidbAsync: async () => {
									return {
										findArrayAsync: async () => {
											return [];
										}, createAsync: async () => {
											return {ops: [{hoge: 'hoge', passwordHash: 'abcdefg'}]}
										}
									}
								}
							}
						}
					});

					const request = {
						body: {
							screenName: 'hogehoge',
							password: 'a1b2c3d4e5f6g',
							name: 'froster',
							description: 'testhoge'
						}
					};
					const res = await routeAccount.post(request, null);

					assert(res.statusCode == 200);
					done();
				}
				catch(e) {
					done(e);
				}
			})();
		});
	});
});
