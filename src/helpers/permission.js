'use strict';

exports.permissionTypes = [
	'iceAuthHost',       // 認証のホスト権限
	'application',         // 連携アプリ操作
	'applicationSpecial', // 連携アプリ特殊操作
	'accountRead',        // アカウント情報の取得
	'accountWrite',       // アカウント情報の変更
	'accountSpecial',     // アカウント情報の特殊操作
	'userRead',           // ユーザー情報の取得
	'userWrite',          // ユーザーのフォロー等のアクション
	'postRead',           // 投稿の取得
	'postWrite',          // 投稿の作成や削除等のアクション
];
