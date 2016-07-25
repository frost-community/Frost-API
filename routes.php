<?php

function indexPage ($req, $res, $container)
{
	return withSuccess($res, null, 'Frost API Server');
}

$routes = [
	['method'=>'get',  'endpoint'=>'/',                            'permissions'=>[],            'indexPage'],

	['method'=>'get',  'endpoint'=>'/ice-auth/request-key',        'permissions'=>[],            'IceAuth::requestKey'],
	['method'=>'get',  'endpoint'=>'/ice-auth/authorize',          'permissions'=>[],            'IceAuth::authorizePage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/access-key',         'permissions'=>['internal'],  'IceAuth::accessKey'],
	['method'=>'post', 'endpoint'=>'/ice-auth/authorize',          'permissions'=>[],            'IceAuth::authorize'],

	['method'=>'get',  'endpoint'=>'/application/application-key', 'permissions'=>['internal'],  'Application::applicationKey'],
	['method'=>'post', 'endpoint'=>'/application/create',          'permissions'=>['internal'],  'Application::create'],
	['method'=>'post', 'endpoint'=>'/application/regenerate-key',  'permissions'=>['internal'],  'Application::regenerateKey'],

	['method'=>'get',  'endpoint'=>'/user',                        'permissions'=>['user-read'], 'User::show'],
	['method'=>'get',  'endpoint'=>'/user/timeline',               'permissions'=>['user-read'], 'User::timeline'],
	['method'=>'post', 'endpoint'=>'/account/create',              'permissions'=>['internal'],  'User::create'],

	['method'=>'get',  'endpoint'=>'/post/timeline',               'permissions'=>['post-read'], 'Post::timeline'],
	['method'=>'post', 'endpoint'=>'/post/create',                 'permissions'=>['post-write'],'Post::create'],
];
