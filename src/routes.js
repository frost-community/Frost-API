'use strict';

module.exports = () => {
	var routes = [
		['get',  '/',                                 {}],

		// Account
		['post', '/account',                          {permissions:['account-special']}],

		// IceAuth
		['post', '/ice-auth/request',                 {}] // 認証リクエスト(リクエストキー取得)
		['get',  '/ice-auth/pin-code',                {permissions:['ice-auth-host']}], // リクエストキーからPINコード取得(認証ホスト専用)
		['post', '/ice-auth/authorize',               {}],

		// Applications
		['post', '/applications',                     {permissions:['application-special']}],
		['get',  '/applications/:id',                 {permissions:['application']}],
		['post', '/applications/:id/application-key', {permissions:['application-special']}],
		['get',  '/applications/:id/application-key', {permissions:['application-special']}],

		// Users
		['get',  '/users/:id',                        {permissions:['user-read']}],
		['get',  '/users/:id/timeline',               {permissions:['user-read']}],
		['get',  '/users/:id/followings',             {permissions:['user-read']}],
		['get',  '/users/:id/followers',              {permissions:['user-read']}],
		['post', '/users/:id/follow',                 {permissions:['user-write']}],
		['del',  '/users/:id/follow',                 {permissions:['user-write']}],

		// Posts
		['post', '/posts/status',                      {permissions:['post-write']}], // ステータスポストを作成する
		['post', '/posts/article',                     {permissions:['post-write']}], // 記事を作成する
		['get',  '/posts/timeline',                    {permissions:['post-read']}],
		['get',  '/posts/{id}',                        {permissions:['post-read']}],
	];

	return routes;
}
