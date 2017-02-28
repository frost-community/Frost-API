'use strict';

module.exports = () => {
	var routes = [
		['get',  '/', {}],

		// == Account ==

		// アカウントを作成する
		['post', '/account', {
			params: [
				{name: 'password', type: 'string'},
				{name: 'description', type: 'string', require: false},
				{name: 'name', type: 'string', require: false}
			], permissions:['account-special']}],

		// == IceAuth ==

		// 認証リクエスト(リクエストキー取得)
		['post', '/ice-auth/request', {
			params: [
				{name: 'application-key', type: 'string'}
			]}],

		// リクエストキーから検証トークン取得(認証ホスト専用エンドポイント)
		['get',  '/ice-auth/verification-key', {
			params: [
				{name: 'application-key', type: 'string'},
				{name: 'request-key', type: 'string'}
			], permissions:['ice-auth-host']}],

		// verification-keyを検証して認証を試行する
		['post', '/ice-auth/authorize', {
			params: [
				{name: 'application-key', type: 'string'},
				{name: 'request-key', type: 'string'},
				{name: 'verification-key', type: 'string'}
			]}],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications', {
			params:[
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string'},
				{name: 'permissions', type: 'array'}
			], permissions:['application-special']}],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id', {
			params: [], permissions:['application']}],

		// アプリケーションキーを生成する
		['post', '/applications/:id/application-key', {
			params: [], permissions:['application-special']}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/application-key', {
			params: [], permissions:['application-special']}],

		// == Users ==

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id', {
			permissions:['user-read']}],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline', {
			params: [], permissions:['user-read']}],

		// フォローの一覧を取得
		['get',  '/users/:id/followings', {
			params: [], permissions:['user-read']}],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers', {
			params: [], permissions:['user-read']}],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow', {
			permissions:['user-write']}],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow', {
			permissions:['user-write']}],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/status', {
			params: [], permissions:['post-write']}],

		// 記事を作成する
		['post', '/posts/article', {
			params: [], permissions:['post-write']}],

		// ホームタイムラインを取得
		['get',  '/posts/timeline', {
			params: [], permissions:['post-read']}],

		// idを指定してポストを取得
		['get',  '/posts/{id}', {
			params: [], permissions:['post-read']}],

	];

	return routes;
}
