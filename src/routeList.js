module.exports = [

	// == info ==

	// このAPIサーバの情報を取得する
	'/info/get', // [old] get /

	// == user ==

	// アカウントを作成する
	'/user/create', // [old] post /users

	// ユーザー情報を取得する
	'/user/get', // [old] get /users/:id & get /users

	// ユーザー情報の一覧を取得する
	'/user/list', // [old] get /users

	// idを指定してユーザー情報を更新する
	'/user/update', // [old] patch /users/:id

	// 指定したユーザーをフォローする
	'/user/follow', // [old] put /users/:id/followings/:target_id

	// 指定したユーザーへのフォローを解除する
	'/user/unfollow', // [old] delete /users/:id/followings/:target_id

	// フォローの一覧を取得する
	'/user/following/list', // [old] get /users/:id/followings

	// フォロワーの一覧を取得する
	'/user/follower/list', // [old] get /users/:id/followers
	
	// 指定したユーザーが対象のユーザーをフォローしているかどうかを取得
	'/user/relation/get', // [old] get /users/:id/followings/:target_id

	// == post ==

	// 短文のポストを作成する
	'/post/create-message', // [old] post /posts/post_status

	// 記事のポストを作成する
	'/post/create-article', // [old] post /posts/post_article

	// 他のポストを参照するポストを作成する
	'/post/create-reference', // [old] post /posts/post_reference

	// idを指定してポストを取得する
	'/post/get', // [old] get /posts/:id

	// 全てのユーザーを対象とした、一般公開のポストを時系列で複数取得する
	'/post/timeline/general/list', // [old] get /general/timeline

	// 対象のユーザーが投稿したポストを時系列で複数取得する
	'/post/timeline/user/list', // [old] get /users/:id/timelines/user

	// 対象のユーザーと、そのユーザーがフォローしてるユーザーが投稿したポストを時系列で複数取得する
	'/post/timeline/home/list', // [old] get /users/:id/timelines/home

	// == storage ==

	// ストレージの状態を取得する
	'/storage/status/get', // [old] get /users/:id/storage

	// ストレージにファイルを追加する
	'/storage/file/add', // [old] post /users/:id/storage/files

	// ストレージのファイルを取得する
	'/storage/file/get', // [old] get /users/:id/storage/files/:file_id

	// ストレージのファイル一覧を取得する
	'/storage/file/list', // [old] get /users/:id/storage/files

	// ストレージの指定したファイルを削除する
	'/storage/file/remove', // [old] delete /users/:id/storage/files/:file_id

	// == app ==

	// アプリケーションを作成する
	'/app/create', // [old] post /applications

	// applicationIdを指定してアプリケーション情報を取得する
	'/app/get', // [old] get /applications/:id

	// ユーザーが作成したアプリケーション情報を一覧で取得する
	'/app/list', // [old] get /applications

	// applicationIdを指定してapplicationSecretを取得する
	'/app/secret/get', // [old] get /applications/:id/secret

	// applicationIdを指定してapplicationSecretを生成する
	'/app/secret/create', // [old] post /applications/:id/secret

	// == auth ==

	// [認証ホスト] トークンデータを取得する
	'/auth/token/get', // [old] get /auth/tokens

	// [認証ホスト] トークンデータを生成する
	'/auth/token/create', // [old] post /auth/tokens

	// [認証ホスト] 認証情報を検証する
	'/auth/credential/validate', // [old] get /auth/valid_credential
];
