<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

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
	['get',    '/application/application-key', ['application-special'], 'ApplicationController::applicationKey'],         // アプリキー表示
	['post',   '/application/application-key', ['application-special'], 'ApplicationController::applicationKeyGenerate'], // アプリキー生成

	// User
	['get',    '/user',                        ['user-read'],           'UserController::show'],
	['get',    '/user/timeline',               ['user-read'],           'UserController::timeline'],
	['post',   '/user/follow',                 ['user-write'],          'UserController::follow'],
	['delete', '/user/follow',                 ['user-write'],          'UserController::unfollow'],

	// Account
	['post',   '/account/create',              ['account-special'],     'UserController::create'],

	// Post
	['get',    '/post',                        ['post-read'],           'PostController::show'],
	['get',    '/post/timeline',               ['post-read'],           'PostController::timeline'],
	['post',   '/post/create',                 ['post-write'],          'PostController::create'],
];
