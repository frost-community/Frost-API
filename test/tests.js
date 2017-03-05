'use strict';

const assert = require('assert');

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
