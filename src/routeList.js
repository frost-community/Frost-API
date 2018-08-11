module.exports = [
	'/info/show', // [old] get /

	// == general

	// 全てのユーザーを対象とする、一般公開されたポストを時系列で複数取得
	'/general/timeline/get', // [old] get /general/timeline

	// == Authorization ==

	// 認証ホスト向けのトークンデータを取得する
	'/auth/token/lookup', // [old] get /auth/tokens

	// 認証ホスト向けのトークンデータを生成する
	'/auth/token/create', // [old] post /auth/tokens

	//
	'/auth/credential/validate', // [old] get /auth/valid_credential

	// == Applications ==

	// ユーザーが作成したアプリケーション情報を一覧で取得する
	'/app/list', // [old] get /applications

	// アプリケーションを作成する
	'/app/create', // [old] post /applications

	// applicationIdを指定してアプリケーション情報を取得する
	'/app/show', // [old] get /applications/:id

	// applicationIdを指定してapplicationSecretを取得する
	'/app/secret/show', // [old] get /applications/:id/secret

	// applicationIdを指定してapplicationSecretを生成する
	'/app/secret/generate', // [old] post /applications/:id/secret

	// == Users ==

	// 一つ以上のscreenNameを指定してユーザー情報を取得する (filter=allで全件取得)
	'/user/list', // [old] get /users

	// アカウントを作成する
	'/user/create', // [old] post /users

	// ユーザー情報を取得する
	'/user/show', // [old] get /users/:id

	// idを指定してユーザー情報を更新する
	'/user/update', // [old] patch /users/:id

	// 対象のユーザーが投稿したポストを時系列で複数取得
	'/user/timeline/get', // [old] get /users/:id/timelines/user

	// 対象のユーザーと、そのユーザーがフォローしてるユーザーが投稿したポストを時系列で複数取得
	'/home/timeline/get', // [old] get /users/:id/timelines/home

	// フォローの一覧を取得
	'/user/following/list', // [old] get /users/:id/followings

	// 指定したユーザーが対象のユーザーをフォローしているかどうかを取得
	'/user/following/show', // [old] get /users/:id/followings/:target_id

	// 指定したユーザーをフォローする
	'/user/follow', // [old] put /users/:id/followings/:target_id

	// 指定したユーザーへのフォローを解除する
	'/user/unfollow', // [old] delete /users/:id/followings/:target_id

	// フォロワーの一覧を取得
	'/user/follower/list', // [old] get /users/:id/followers

	'/user/storage/status/get', // [old] get /users/:id/storage

	'/user/storage/file/list', // [old] get /users/:id/storage/files

	'/user/storage/file/create', // [old] post /users/:id/storage/files

	'/user/storage/file/show', // [old] get /users/:id/storage/files/:file_id

	'/user/storage/file/remove', // [old] delete /users/:id/storage/files/:file_id

	// == Posts ==

	// 短文のポストを作成する
	'/post/create_status', // [old] post /posts/post_status

	// 記事のポストを作成する
	'/post/create_article', // [old] post /posts/post_article

	// 他のポストを参照するポストを作成する
	'/post/create_reference', // [old] post /posts/post_reference

	// idを指定してポストを取得
	'/post/show' // [old] get /posts/:id
];
