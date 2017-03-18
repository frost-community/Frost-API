'use strict';

module.exports = () => {
	const routes = [
		['get', '/', {}],

		// == Account ==

		// アカウントを作成する
		['post', '/account', {
			params: [
				{name: 'password', type: 'string'},
				{name: 'description', type: 'string', require: false},
				{name: 'name', type: 'string', require: false}
			], permissions:['account_special']
		}],

		// == IceAuth ==

		// 認証リクエスト(ice_auth_key取得)
		['post', '/ice_auth', {
			params: [
				{name: 'application_key', type: 'string'}
			]
		}],

		// verification_code(PINコード)を取得 (認証ホスト専用)
		['get',  '/ice_auth/verification_code', {
			headers: ['X-Ice-Auth-Key'], permissions:['ice_auth_host']
		}],

		// 認証の対象ユーザーを設定(認証ホスト専用)
		['post', '/ice_auth/target_user', {
			params: [
				{name: 'user_id', type: 'string'}
			], headers: ['X-Ice-Auth-Key'], permissions:['ice_auth_host']
		}],

		// verification_codeを検証して、access_keyを作成
		['post', '/ice_auth/access_key', {
			params: [
				{name: 'verification_code', type: 'string'}
			], headers: ['X-Ice-Auth-Key']
		}],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications', {
			params:[
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string', require: false},
				{name: 'permissions', type: 'array'}
			], permissions:['application_special']
		}],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id', {
			permissions:['application']
		}],

		// アプリケーションキーを生成する
		['post', '/applications/:id/application_key', {
			permissions:['application_special']
		}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/application_key', {
			permissions:['application_special']
		}],

		// == Users ==

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id', {
			params: [

			], permissions:['user_read']
		}],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline', {
			params: [

			], permissions:['user_read']
		}],

		// フォローの一覧を取得
		['get',  '/users/:id/followings', {
			params: [

			], permissions:['user_read']
		}],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers', {
			params: [

			], permissions:['user_read']
		}],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow', {
			params: [

			], permissions:['user_write']
		}],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow', {
			params: [

			], permissions:['user_write']
		}],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/post_status', {
			params: [

			], permissions:['post_write']
		}],

		// 記事を作成する
		['post', '/posts/post_article', {
			params: [

			], permissions:['post_write']
		}],

		// 投稿リンクを作成する
		['post', '/posts/post_link', {
			params: [

			], permissions:['post_write']
		}],

		// idを指定してポストを取得
		['get',  '/posts/:id', {
			params: [

			], permissions:['post_read']
		}],
	];

	return routes;
};
