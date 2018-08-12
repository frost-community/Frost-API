module.exports = [
	'/info/get', // [old] get /

	// == Authorization ==

	// 認証ホスト向けのトークンデータを取得する
	'/auth/token/get', // [old] get /auth/tokens

	// 認証ホスト向けのトークンデータを生成する
	'/auth/token/create', // [old] post /auth/tokens

	//
	'/auth/credential/validate', // [old] get /auth/valid_credential

	// == Applications ==

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

	// == Users ==

	// アカウントを作成する
	'/user/create', // [old] post /users

	// ユーザー情報を取得する
	'/user/show', // [old] get /users/:id

	// 一つ以上のscreenNameを指定してユーザー情報を取得する (filter=allで全件取得)
	'/user/list', // [old] get /users

	// idを指定してユーザー情報を更新する
	'/user/update', // [old] patch /users/:id

	// 指定したユーザーが対象のユーザーをフォローしているかどうかを取得
	'/user/relation/get', // [old] get /users/:id/followings/:target_id

	// 指定したユーザーをフォローする
	'/user/relation/follow', // [old] put /users/:id/followings/:target_id

	// 指定したユーザーへのフォローを解除する
	'/user/relation/unfollow', // [old] delete /users/:id/followings/:target_id

	// フォローの一覧を取得
	'/user/relation/following/list', // [old] get /users/:id/followings

	// フォロワーの一覧を取得
	'/user/relation/follower/list', // [old] get /users/:id/followers

	'/user/storage/status/get', // [old] get /users/:id/storage

	'/user/storage/file/create', // [old] post /users/:id/storage/files

	'/user/storage/file/show', // [old] get /users/:id/storage/files/:file_id

	'/user/storage/file/list', // [old] get /users/:id/storage/files

	'/user/storage/file/remove', // [old] delete /users/:id/storage/files/:file_id

	// == Posts ==

	// 短文のポストを作成する
	'/post/create_status', // [old] post /posts/post_status

	// 記事のポストを作成する
	'/post/create_article', // [old] post /posts/post_article

	// 他のポストを参照するポストを作成する
	'/post/create_reference', // [old] post /posts/post_reference

	// idを指定してポストを取得
	'/post/show', // [old] get /posts/:id

	// == Timelines ==

	// 全てのユーザーを対象とする、一般公開されたポストを時系列で複数取得
	'/timeline/general/get', // [old] get /general/timeline

	// 対象のユーザーが投稿したポストを時系列で複数取得
	'/timeline/user/get', // [old] get /users/:id/timelines/user

	// 対象のユーザーと、そのユーザーがフォローしてるユーザーが投稿したポストを時系列で複数取得
	'/timeline/home/get' // [old] get /users/:id/timelines/home
];
