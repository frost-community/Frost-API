<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

// post:   作成・更新
// get:    取得
// delete: 削除

$routes = [
	// Top
	['get',    '/',                            [],                      'indexPage'],

	// IceAuth
	['post',   '/ice-auth/request',            [],                      'IceAuthController::requestCreate'],              // 認証リクエスト(リクエストキー表示)
	['get',    '/ice-auth/pin-code',           ['ice-auth-host'],       'IceAuthController::pinCodeShow'],                // リクエストキーからPINコード取得
	['post',   '/ice-auth/authorize',          [],                      'IceAuthController::accessKeyAuth'],              // 認証試行(PINコード)

	// Application
	['post',   '/application',                 ['application-special'], 'ApplicationController::create'],                 // アプリ情報生成
	['get',    '/application',                 ['application'],         'ApplicationController::show'],                   // アプリ情報表示
	['post',   '/application/application-key', ['application-special'], 'ApplicationController::applicationKeyGenerate'], // アプリキー生成
	['get',    '/application/application-key', ['application-special'], 'ApplicationController::applicationKeyShow'],     // アプリキー表示

	// User
	['get',    '/user',                        ['user-read'],           'UserController::show'],
	['get',    '/user/timeline',               ['user-read'],           'UserController::timeline'],
	['get',    '/user/followings',             ['user-read'],           'UserController::followings'],
	['get',    '/user/followers',              ['user-read'],           'UserController::followers'],
	['post',   '/user/follow',                 ['user-write'],          'UserController::followCreate'],
	['delete', '/user/follow',                 ['user-write'],          'UserController::followDestroy'],

	// Account
	['post',   '/account',                     ['account-special'],     'AccountController::create'],

	// Post
	['post',   '/post/status',                 ['post-write'],          'PostController::statusCreate'],
	['post',   '/post/article',                ['post-write'],          'PostController::articleCreate'],
	['get',    '/post',                        ['post-read'],           'PostController::show'],
	['get',    '/post/timeline',               ['post-read'],           'PostController::timeline']
];
