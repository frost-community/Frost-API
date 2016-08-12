<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, ['message' => 'Frost API Server']);
}

// post:   作成
// get:    取得
// put:    更新
// delete: 削除

$routes = [
	// Top
	['get',    '/',                                 [],                      'indexPage'],

	// IceAuth
	['post',   '/ice-auth/request',                 [],                      'IceAuthController::requestCreate'],              // 認証リクエスト(リクエストキー取得)
	['get',    '/ice-auth/pin-code',                ['ice-auth-host'],       'IceAuthController::pinCodeShow'],                // リクエストキーからPINコード取得(認証ホスト専用)
	['post',   '/ice-auth/authorize',               [],                      'IceAuthController::accessKeyAuth'],              // 認証試行(PINコード)

	// Application
	['post',   '/application',                      ['application-special'], 'ApplicationController::create'],                 // アプリ情報生成
	['get',    '/application/{id}',                 ['application'],         'ApplicationController::show'],                   // アプリ情報表示
	['post',   '/application/{id}/application-key', ['application-special'], 'ApplicationController::applicationKeyGenerate'], // アプリキー生成
	['get',    '/application/{id}/application-key', ['application-special'], 'ApplicationController::applicationKeyShow'],     // アプリキー表示

	// User
	['get',    '/user/{id}',                        ['user-read'],           'UserController::show'],
	['get',    '/user/{id}/timeline',               ['user-read'],           'UserController::timeline'],
	['get',    '/user/{id}/followings',             ['user-read'],           'UserController::followings'],
	['get',    '/user/{id}/followers',              ['user-read'],           'UserController::followers'],
	['post',   '/user/{id}/follow',                 ['user-write'],          'UserController::followCreate'],
	['delete', '/user/{id}/follow',                 ['user-write'],          'UserController::followDestroy'],

	// Account
	['post',   '/account',                          ['account-special'],     'AccountController::create'],

	// Post
	['post',   '/post/status',                      ['post-write'],          'PostController::statusCreate'],  // ステータスポストを作成する
	['post',   '/post/article',                     ['post-write'],          'PostController::articleCreate'], // 記事を作成する
	['get',    '/post/timeline',                    ['post-read'],           'PostController::timeline'],
	['get',    '/post/{id}',                        ['post-read'],           'PostController::show'],
];
