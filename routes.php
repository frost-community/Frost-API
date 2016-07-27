<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

$routes = [
	// Top
	['get',    '/',                            [],                      'indexPage'],

	// IceAuth
	['post',   '/ice-auth/request',            [],                      'IceAuth::requestGenerate'],            // 認証リクエスト(リクエストキー表示)
	['get',    '/ice-auth/pin-code',           ['ice-auth-host'],       'IceAuth::pinCodeShow'],                // リクエストキーからPINコード取得
	['post',   '/ice-auth/authorize',          [],                      'IceAuth::accessKeyAuth'],              // 認証試行(PINコード)
/*	['post',   '/ice-auth/access-key',         ['application-special'], 'IceAuth::accessKeyGenerate'],          // アクセスキー生成 */
/*	['get',    '/ice-auth/access-key',         ['application-special'], 'IceAuth::accessKeyShow'],              // アクセスキー表示 */

	// Application
	['post',   '/application',                 ['application-special'], 'Application::create'],                 // アプリ情報生成
	['get',    '/application',                 ['application'],         'Application::show'],                   // アプリ情報表示
	['get',    '/application/application-key', ['application-special'], 'Application::applicationKey'],         // アプリキー表示
	['post',   '/application/application-key', ['application-special'], 'Application::applicationKeyGenerate'], // アプリキー生成

	// User
	['get',    '/user',                        ['user-read'],           'User::show'],
	['get',    '/user/timeline',               ['user-read'],           'User::timeline'],
	['post',   '/user/follow',                 ['user-write'],          'User::follow'],
	['delete', '/user/follow',                 ['user-write'],          'User::unfollow'],

	// Account
	['post',   '/account/create',              ['account-special'],        'User::create'],

	// Post
	['get',    '/post',                        ['post-read'],           'Post::show'],
	['get',    '/post/timeline',               ['post-read'],           'Post::timeline'],
	['post',   '/post/create',                 ['post-write'],          'Post::create'],
];
