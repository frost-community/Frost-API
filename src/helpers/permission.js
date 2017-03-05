'use strict';

exports.permissionTypes = [
	'ice_auth_host',       // 認証のホスト権限
	'application',         // 連携アプリ操作
	'application_special', // 連携アプリ特殊操作
	'account_read',        // アカウント情報の取得
	'account_write',       // アカウント情報の変更
	'account_special',     // アカウント情報の特殊操作
	'user_read',           // ユーザー情報の取得
	'user_write',          // ユーザーのフォロー等のアクション
	'post_read',           // 投稿の取得
	'post_write',          // 投稿の作成や削除等のアクション
];
