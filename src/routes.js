'use strict';

module.exports = () => {
	let routes = [
		['get', '/', {}],

		// == Account ==

		// アカウントを作成する
		['post', '/account', {
			params: [
				{name: 'password', type: 'string'},
				{name: 'description', type: 'string', require: false},
				{name: 'name', type: 'string', require: false}
			], permissions:['accountSpecial']}],

		// == IceAuth ==

		// 認証リクエスト(リクエストキー取得)
		['post', '/iceAuth/request', {
			params: [
				{name: 'applicationKey', type: 'string'}
			]}],

		// リクエストキーから検証トークン取得(認証ホスト専用エンドポイント)
		['get',  '/iceAuth/verificationKey', {
			params: [
				{name: 'applicationKey', type: 'string'},
				{name: 'requestKey', type: 'string'}
			], permissions:['iceAuthHost']}],

		// verificationKeyを検証して認証を試行する
		['post', '/iceAuth/authorize', {
			params: [
				{name: 'applicationKey', type: 'string'},
				{name: 'requestKey', type: 'string'},
				{name: 'verificationKey', type: 'string'}
			]}],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications', {
			params:[
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string'},
				{name: 'permissions', type: 'array'}
			], permissions:['applicationSpecial']}],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id', {
			params: [], permissions:['application']}],

		// アプリケーションキーを生成する
		['post', '/applications/:id/applicationKey', {
			params: [], permissions:['applicationSpecial']}],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/applicationKey', {
			params: [], permissions:['applicationSpecial']}],

		// == Users ==

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id', {
			permissions:['userRead']}],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline', {
			params: [], permissions:['userRead']}],

		// フォローの一覧を取得
		['get',  '/users/:id/followings', {
			params: [], permissions:['userRead']}],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers', {
			params: [], permissions:['userRead']}],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow', {
			permissions:['userWrite']}],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow', {
			permissions:['userWrite']}],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/status', {
			params: [], permissions:['postWrite']}],

		// 記事を作成する
		['post', '/posts/article', {
			params: [], permissions:['postWrite']}],

		// ホームタイムラインを取得
		['get',  '/posts/timeline', {
			params: [], permissions:['postRead']}],

		// idを指定してポストを取得
		['get',  '/posts/{id}', {
			params: [], permissions:['postRead']}],

	];

	return routes;
};
