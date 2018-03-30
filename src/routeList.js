module.exports = [
	['get', '/'],

	// == general

	// 全てのユーザーを対象とする、一般公開されたポストを時系列で複数取得
	['get', '/general/timeline'],

	// == Authorization ==

	// 認証ホスト向けのトークンデータを取得する
	['get', '/auth/tokens'],

	// 認証ホスト向けのトークンデータを生成する
	['post', '/auth/tokens'],

	// == Applications ==

	// ユーザーが作成したアプリケーション情報を一覧で取得する
	['get', '/applications'],

	// アプリケーションを作成する
	['post', '/applications'],

	// applicationIdを指定してアプリケーション情報を取得する
	['get', '/applications/:id'],

	// applicationIdを指定してapplicationSecretを取得する
	['get', '/applications/:id/secret'],

	// applicationIdを指定してapplicationSecretを生成する
	['post', '/applications/:id/secret'],

	// == Users ==

	// 一つ以上のscreenNameを指定してユーザー情報を取得する
	['get', '/users'],

	// アカウントを作成する
	['post', '/users'],

	// ユーザー情報を取得する
	['get', '/users/:id'],

	// idを指定してユーザー情報を更新する
	['patch', '/users/:id'],

	// 対象のユーザーが投稿したポストを時系列で複数取得
	['get', '/users/:id/timelines/user'],

	// 対象のユーザーと、そのユーザーがフォローしてるユーザーが投稿したポストを時系列で複数取得
	['get', '/users/:id/timelines/home'],

	// フォローの一覧を取得
	['get', '/users/:id/followings'],

	// 指定したユーザーが対象のユーザーをフォローしているかどうかを取得
	['get', '/users/:id/followings/:target_id'],

	// 指定したユーザーをフォローする
	['put', '/users/:id/followings/:target_id'],

	// 指定したユーザーへのフォローを解除する
	['delete', '/users/:id/followings/:target_id'],

	// フォロワーの一覧を取得
	['get', '/users/:id/followers'],

	/*
	['get', '/users/:id/storage'],

	['get', '/users/:id/storage/files'],

	['post', '/users/:id/storage/files'],

	['get', '/users/:id/storage/files/:file_id'],

	['delete', '/users/:id/storage/files/:file_id'],
	*/

	// == Posts ==

	// 短文のポストを作成する
	['post', '/posts/post_status'],

	// 記事のポストを作成する
	['post', '/posts/post_article'],

	// 他のポストを参照するポストを作成する
	['post', '/posts/post_reference'],

	// idを指定してポストを取得
	['get', '/posts/:id']
];
