'use strict';

describe('Users API', () => {
	describe('/users', () => {
		describe('/id', () => {
			describe('[GET]', () => {
				it('正しくリクエストされた場合は成功する');
			});
			describe('/timeline', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/followings', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/followers', () => {
				describe('[GET]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/follow', () => {
				describe('[POST]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
			describe('/follow', () => {
				describe('[DELETE]', () => {
					it('正しくリクエストされた場合は成功する');
				});
			});
		});
	});
});
