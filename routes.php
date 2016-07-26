<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

$routes = [
	// Top
	[ 'get',  '/',                                     [],                            'indexPage' ],

	// IceAuth
	[ 'get',  '/ice-auth/request-key',                 [],                            'IceAuth::requestKey' ],
	[ 'post', '/ice-auth/access-key/authorize',        [],                            'IceAuth::accessKeyAuth' ],
	[ 'get',  '/ice-auth/pin-code',                    ['internal', 'ice-auth-host'], 'IceAuth::pinCodeShow' ],
	[ 'get',  '/ice-auth/access-key',                  ['internal', 'ice-auth-host'], 'IceAuth::accessKeyShow' ],
	[ 'post', '/ice-auth/access-key/generate',         ['internal', 'ice-auth-host'], 'IceAuth::accessKeyGenerate' ],

	// DevelopersCenter(Application)
	[ 'post', '/application/create',                   ['internal', 'dev-center'],    'Application::create' ],
	[ 'get',  '/application/application-key',          ['internal', 'dev-center'],    'Application::applicationKey' ],
	[ 'post', '/application/application-key/generate', ['internal', 'dev-center'],    'Application::applicationKeyGenerate' ],

	// User
	[ 'get', '/user',                                  ['user-read'],                 'User::show' ],
	[ 'get', '/user/timeline',                         ['user-read'],                 'User::timeline' ],

	// Account
	[ 'post', '/account/create',                       ['internal'],                  'User::create' ],

	// Post
	[ 'get',  '/post',                                 ['post-read'],                 'Post::show' ],
	[ 'get',  '/post/timeline',                        ['post-read'],                 'Post::timeline' ],
	[ 'post', '/post/create',                          ['post-write'],                'Post::create' ],
];
