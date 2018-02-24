const permissionTypes = [
	'iceAuthHost',        // 認証のホスト権限
	'application',        // 連携アプリ操作
	'applicationSpecial', // 連携アプリ特殊操作
	'accountRead',        // アカウント情報の取得
	'accountWrite',       // アカウント情報の変更
	'accountSpecial',     // アカウント情報の特殊操作
	'userRead',           // ユーザー情報の取得
	'userWrite',          // ユーザーのフォロー等のアクション
	'userSpecial',        // ユーザー情報の特殊操作
	'postRead',           // 投稿やリアクションの取得
	'postWrite',          // 投稿やリアクションの作成・削除等のアクション
	'storageRead',        // ストレージへの読み取り操作
	'storageWrite',       // ストレージへの書き込み操作
];

module.exports = {
	permissionTypes
};
