'use strict';

module.exports = () => {
	var routes = [
		['get',  '/',                                 {}],

		// Account
		['post', '/account',                          {params: [], permissions:['account-special']}],

		// IceAuth
		['post', '/ice-auth/request',                 {params: []}], // 認証リクエスト(リクエストキー取得)
		['get',  '/ice-auth/pin-code',                {params: [], permissions:['ice-auth-host']}], // リクエストキーからPINコード取得(認証ホスト専用)
		['post', '/ice-auth/authorize',               {params: []}],

		// Applications
		['post', '/applications',                     {params:[{name: "name", type: "string"}, {name: "description", type: "string"}, {name: "permissions", type: "array"}], permissions:['application-special']}],
		['get',  '/applications/:id',                 {params: [], permissions:['application']}],
		['post', '/applications/:id/application-key', {params: [], permissions:['application-special']}],
		['get',  '/applications/:id/application-key', {params: [], permissions:['application-special']}],

		// Users
		['get',  '/users/:id',                        {permissions:['user-read']}],
		['get',  '/users/:id/timeline',               {params: [], permissions:['user-read']}],
		['get',  '/users/:id/followings',             {params: [], permissions:['user-read']}],
		['get',  '/users/:id/followers',              {params: [], permissions:['user-read']}],
		['post', '/users/:id/follow',                 {permissions:['user-write']}],
		['del',  '/users/:id/follow',                 {permissions:['user-write']}],

		// Posts
		['post', '/posts/status',                      {params: [], permissions:['post-write']}], // ステータスポストを作成する
		['post', '/posts/article',                     {params: [], permissions:['post-write']}], // 記事を作成する
		['get',  '/posts/timeline',                    {params: [], permissions:['post-read']}],
		['get',  '/posts/{id}',                        {params: [], permissions:['post-read']}],
	];

	return routes;
}
