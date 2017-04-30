'use strict';

module.exports = () => {
	const routes = [
		['get', '/'],

		// == Account ==

		// アカウントを作成する
		['post', '/account'],

		// == IceAuth ==

		// 認証リクエスト
		['post', '/ice_auth'],

		// verificationCode(PINコード)を取得 (認証ホスト専用)
		['get',  '/ice_auth/verification_code'],

		// 認証の対象ユーザーを設定(認証ホスト専用)
		['post', '/ice_auth/target_user'],

		// 直接screenNameとpasswordを検証して、accessKeyを作成(認証ホスト専用)
		['post', '/ice_auth/authorize_basic'],

		// verificationCodeを検証して、accessKeyを作成
		['post', '/ice_auth/authorize'],

		// == Applications ==

		// アプリケーションを作成する
		['post', '/applications'],

		// ユーザーが作成したアプリケーション情報を一覧で取得する
		['get', '/applications'],

		// idを指定してアプリケーション情報を取得する
		['get',  '/applications/:id'],

		// アプリケーションキーを生成する
		['post', '/applications/:id/application_key'],

		// idを指定してアプリケーションキーを取得する
		['get',  '/applications/:id/application_key'],

		// == Users ==

		// 一つ以上のscreenNameを指定してユーザー情報を取得する
		['get',  '/users'],

		// idを指定してユーザー情報を取得する
		['get',  '/users/:id'],

		// 指定したユーザーのタイムラインを取得
		['get',  '/users/:id/timeline'],

		// フォローの一覧を取得
		['get',  '/users/:id/followings'],

		// フォロワーの一覧を取得
		['get',  '/users/:id/followers'],

		// 指定したユーザーをフォローする
		['post', '/users/:id/follow'],

		// 指定したユーザーへのフォローを解除する
		['del',  '/users/:id/follow'],

		// == Posts ==

		// ステータスポストを作成する
		['post', '/posts/post_status'],

		// 記事を作成する
		['post', '/posts/post_article'],

		// 投稿リンクを作成する
		['post', '/posts/post_link'],

		// idを指定してポストを取得
		['get',  '/posts/:id']
	];

	return routes;
};
