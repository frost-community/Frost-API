'use strict';

exports.permissionTypes = [
	'ice-auth-host',       // 認証のホスト権限
	'application',         // 連携アプリ操作
	'application-special', // 連携アプリ特殊操作
	'account-read',        // アカウント情報の取得
	'account-write',       // アカウント情報の変更
	'account-special',     // アカウント情報の特殊操作
	'user-read',           // ユーザー情報の取得
	'user-write',          // ユーザーのフォロー等のアクション
	'post-read',           // 投稿の取得
	'post-write',          // 投稿の作成や削除等のアクション
];
