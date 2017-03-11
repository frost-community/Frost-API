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
			], permissions:['account_special']}],

		// ホームタイムラインを取得
		['get',  '/account/timeline', {
			params: [], permissions:['post_read']}],

		// == IceAuth ==

		// 認証リクエスト(リクエストキー取得)
		['post', '/ice_auth/request', {
			params: [
				{name: 'application_key', type: 'string'}
			]}],

		// リクエストキーからverification_key(PINコード)取得(認証ホスト専用エンドポイント)
		['get',  '/ice_auth/verification_key', {
			params: [
				{name: 'application_key', type: 'string'},
				{name: 'request_key', type: 'string'}
			], permissions:['ice_auth_host']}],

		// verification_keyを検証して認証を試行する
		['post', '/ice_auth/authorize', {
			params: [
				{name: 'application_key', type: 'string'},
				{name: 'request_key', type: 'string'},
				{name: 'verification_key', type: 'string'}
			]}],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications', {
			params:[
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string'},
				{name: 'permissions', type: 'array'}
			], permissions:['application_special']}],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id', {
			params: [], permissions:['application']}],

		// アプリケーションキーを生成する
		['post', '/applications/:id/application_key', {
			params: [], permissions:['application_special']}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/application_key', {
			params: [], permissions:['application_special']}],

		// == Users ==

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id', {
			permissions:['user_read']}],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline', {
			params: [], permissions:['user_read']}],

		// フォローの一覧を取得
		['get',  '/users/:id/followings', {
			params: [], permissions:['user_read']}],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers', {
			params: [], permissions:['user_read']}],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow', {
			permissions:['user_write']}],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow', {
			permissions:['user_write']}],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/status', {
			params: [], permissions:['post_write']}],

		// 記事を作成する
		['post', '/posts/article', {
			params: [], permissions:['post_write']}],

		// idを指定してポストを取得
		['get',  '/posts/:id', {
			params: [], permissions:['post_read']}],
	];

	return routes;
};
