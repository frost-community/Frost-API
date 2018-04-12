module.exports = [
	// 認可付与のホスト権限
	{ name: 'auth.host', grantable: false },
	// 連携アプリの作成操作
	{ name: 'app.create', grantable: false },
	// 連携アプリの読み取り操作
	{ name: 'app.read', grantable: true },
	// 連携アプリの書き換え操作
	{ name: 'app.write', grantable: true },
	// 連携アプリのホスト権限
	{ name: 'app.host', grantable: false },
	// ユーザー情報の作成
	{ name: 'user.create', grantable: false },
	// ユーザー情報の取得
	{ name: 'user.read', grantable: true },
	// ユーザー情報の書き換え
	{ name: 'user.write', grantable: true },
	// ユーザー情報の削除
	{ name: 'user.delete', grantable: false },
	// アカウントの非公開情報等の取得
	{ name: 'user.account.read', grantable: true },
	// アカウントの非公開情報等の書き換え
	{ name: 'user.account.write', grantable: true },
	// 投稿やリアクションの取得
	{ name: 'post.read', grantable: true },
	// 投稿やリアクションの作成・削除・書き換えの操作
	{ name: 'post.write', grantable: true },
	// ストレージへの読み取り操作
	{ name: 'storage.read', grantable: true },
	// ストレージへの書き換え操作
	{ name: 'storage.write', grantable: true }
];
