<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

$routes = [
	// Top
	[ 'get',  '/',                            [],                         'indexPage' ],

	// IceAuth
	[ 'get',  '/ice-auth/request-key',        [],                         'IceAuth::requestKey' ],
	[ 'get',  '/ice-auth/authorize',          [],                         'IceAuth::authorizePage' ],
	[ 'get',  '/ice-auth/access-key',         ['internal'],               'IceAuth::accessKey' ],
	[ 'post', '/ice-auth/authorize',          [],                         'IceAuth::authorize' ],

	// DevelopersCenter(Application)
	[ 'get',  '/application/application-key', ['internal', 'dev-center'], 'Application::applicationKey' ],
	[ 'post', '/application/create',          ['internal', 'dev-center'], 'Application::create' ],
	[ 'post', '/application/regenerate-key',  ['internal', 'dev-center'], 'Application::regenerateKey' ],

	// User
	[ 'get', '/user',                         ['user-read'],              'User::show' ],
	[ 'get', '/user/timeline',                ['user-read'],              'User::timeline' ],

	// Account
	[ 'post', '/account/create',              ['internal'],               'User::create' ],

	// Post
	[ 'get',  '/post/timeline',               ['post-read'],              'Post::timeline' ],
	[ 'post', '/post/create',                 ['post-write'],             'Post::create' ],
];
