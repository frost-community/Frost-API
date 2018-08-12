module.exports = [

	// == general ==

	// このAPIサーバの情報を取得する
	'/info/get', // [old] get /

	// == auth ==

	// [認証ホスト] トークンデータを取得する
	'/auth/token/get', // [old] get /auth/tokens

	// [認証ホスト] トークンデータを生成する
	'/auth/token/create', // [old] post /auth/tokens

	// [認証ホスト] 認証情報を検証する
	'/auth/credential/validate', // [old] get /auth/valid_credential

	// == app ==

	// アプリケーションを作成する
	'/app/create', // [old] post /applications

	// applicationIdを指定してアプリケーション情報を取得する
	'/app/show', // [old] get /applications/:id

	// ユーザーが作成したアプリケーション情報を一覧で取得する
	'/app/list', // [old] get /applications

	// applicationIdを指定してapplicationSecretを取得する
	'/app/secret/show', // [old] get /applications/:id/secret

	// applicationIdを指定してapplicationSecretを生成する
	'/app/secret/create', // [old] post /applications/:id/secret

	// == user ==

	// アカウントを作成する
	'/user/create', // [old] post /users

	// ユーザー情報を取得する
	'/user/show', // [old] get /users/:id

	// 一つ以上のscreenNameを指定してユーザー情報を取得する
	'/user/lookup', // [old] get /users

	// ユーザー情報の一覧を取得する
	'/user/list', // [old] get /users

	// idを指定してユーザー情報を更新する
	'/user/update', // [old] patch /users/:id

	// 指定したユーザーが対象のユーザーをフォローしているかどうかを取得
	'/user/relation/get', // [old] get /users/:id/followings/:target_id

	// 指定したユーザーをフォローする
	'/user/relation/follow', // [old] put /users/:id/followings/:target_id

	// 指定したユーザーへのフォローを解除する
	'/user/relation/unfollow', // [old] delete /users/:id/followings/:target_id

	// フォローの一覧を取得する
	'/user/relation/following/list', // [old] get /users/:id/followings

	// フォロワーの一覧を取得する
	'/user/relation/follower/list', // [old] get /users/:id/followers

	// ストレージの状態を取得する
	'/user/storage/status/get', // [old] get /users/:id/storage

	// ストレージにファイルを追加する
	'/user/storage/file/add', // [old] post /users/:id/storage/files

	// ストレージのファイルを取得する
	'/user/storage/file/show', // [old] get /users/:id/storage/files/:file_id

	// ストレージのファイル一覧を取得する
	'/user/storage/file/list', // [old] get /users/:id/storage/files

	// ストレージの指定したファイルを削除する
	'/user/storage/file/remove', // [old] delete /users/:id/storage/files/:file_id

	// == post ==

	// 短文のポストを作成する
	'/post/create_status', // [old] post /posts/post_status

	// 記事のポストを作成する
	'/post/create_article', // [old] post /posts/post_article

	// 他のポストを参照するポストを作成する
	'/post/create_reference', // [old] post /posts/post_reference

	// idを指定してポストを取得する
	'/post/show', // [old] get /posts/:id

	// == timeline ==

	// 全てのユーザーを対象とした、一般公開のポストを時系列で複数取得する
	'/timeline/general/get', // [old] get /general/timeline

	// 対象のユーザーが投稿したポストを時系列で複数取得する
	'/timeline/user/get', // [old] get /users/:id/timelines/user

	// 対象のユーザーと、そのユーザーがフォローしてるユーザーが投稿したポストを時系列で複数取得する
	'/timeline/home/get' // [old] get /users/:id/timelines/home

];
