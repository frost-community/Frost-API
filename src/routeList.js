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
			], permissions:['accountSpecial']
		}],

		// == IceAuth ==

		// 認証リクエスト(iceAuthKey取得)
		['post', '/ice_auth', {
			params: [
				{name: 'applicationKey', type: 'string'}
			]
		}],

		// verificationCode(PINコード)を取得 (認証ホスト専用)
		['get',  '/ice_auth/verification_code', {
			headers: ['X-Ice-Auth-Key'], permissions:['iceAuthHost']
		}],

		// 認証の対象ユーザーを設定(認証ホスト専用)
		['post', '/ice_auth/target_user', {
			params: [
				{name: 'userId', type: 'string'}
			], headers: ['X-Ice-Auth-Key'], permissions:['iceAuthHost']
		}],

		// verificationCodeを検証して、accessKeyを作成
		['post', '/ice_auth/access_key', {
			params: [
				{name: 'verificationCode', type: 'string'}
			], headers: ['X-Ice-Auth-Key']
		}],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications', {
			params:[
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string', require: false},
				{name: 'permissions', type: 'array'}
			], permissions:['applicationSpecial']
		}],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id', {
			permissions:['application']
		}],

		// アプリケーションキーを生成する
		['post', '/applications/:id/application_key', {
			permissions:['applicationSpecial']
		}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/application_key', {
			permissions:['applicationSpecial']
		}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/access_key', {
			permissions:['applicationSpecial']
		}],

		// == Users ==

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id', {
			params: [

			], permissions:['userRead']
		}],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline', {
			params: [

			], permissions:['userRead']
		}],

		// フォローの一覧を取得
		['get',  '/users/:id/followings', {
			params: [

			], permissions:['userRead']
		}],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers', {
			params: [

			], permissions:['userRead']
		}],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow', {
			params: [

			], permissions:['userWrite']
		}],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow', {
			params: [

			], permissions:['userWrite']
		}],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/post_status', {
			params: [

			], permissions:['postWrite']
		}],

		// 記事を作成する
		['post', '/posts/post_article', {
			params: [

			], permissions:['postWrite']
		}],

		// 投稿リンクを作成する
		['post', '/posts/post_link', {
			params: [

			], permissions:['postWrite']
		}],

		// idを指定してポストを取得
		['get',  '/posts/:id', {
			params: [

			], permissions:['postRead']
		}],
	];

	return routes;
};
