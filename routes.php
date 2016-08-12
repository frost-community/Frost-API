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

	// Account
	['post',   '/account',                          ['account-special'],     'AccountController::create'],

	// User
	['get',    '/user/{id}',                        ['user-read'],           'UserController::show'],
	['get',    '/user/{id}/timeline',               ['user-read'],           'UserController::timeline'],
	['get',    '/user/{id}/followings',             ['user-read'],           'UserController::followings'],
	['get',    '/user/{id}/followers',              ['user-read'],           'UserController::followers'],
	['post',   '/user/{id}/follow',                 ['user-write'],          'UserController::followCreate'],
	['delete', '/user/{id}/follow',                 ['user-write'],          'UserController::followDestroy'],

	// Post
	['post',   '/post/status',                      ['post-write'],          'PostController::statusCreate'],
	['post',   '/post/article',                     ['post-write'],          'PostController::articleCreate'],
	['get',    '/post',                             ['post-read'],           'PostController::show'],
	['get',    '/post/timeline',                    ['post-read'],           'PostController::timeline'],

	// Favorite
	['post',   '/favorite',                         ['post-write'],          'PostController::statusCreate'],
	['post',   '/post/article',                     ['post-write'],          'PostController::articleCreate'],
	['get',    '/post',                             ['post-read'],           'PostController::show'],
	['get',    '/post/timeline',                    ['post-read'],           'PostController::timeline'],

	// Community
	['post', '/community',                                            [], ], // コミュニティ情報生成
	['get',  '/community/{id}',                                       [], ], // コミュニティ情報取得
	['post', '/community/{id}/join-request',                          [], ], // このコミュニティへの参加申請
	['get',  '/community/{id}/join-requests',                         [], ], // このコミュニティへの参加申請の一覧
	['get',  '/community/{id}/join-request/{join-request-id}',        [], ], // このコミュニティへの参加申請詳細表示
	['post', '/community/{id}/join-request/{join-request-id}/accept', [], ], // このコミュニティへの参加申請を承認
	['post', '/community/{id}/join-request/{join-request-id}/refuse', [], ], // このコミュニティへの参加申請を拒否
	['post', '/community/{id}/defect',                                [], ], // このコミュニティから脱退

];
