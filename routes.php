<?php

function indexPage ($req, $res, $container)
{
	$res->getBody()->write('Frost API Server');
	return $res;
}

$routes = [
	['method'=>'get',  'endpoint'=>'/',                            'permissions'=>[],            'indexPage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/request-key',        'permissions'=>[],            'IceAuth::requestKey'],
	['method'=>'get',  'endpoint'=>'/ice-auth/authorize',          'permissions'=>[],            'IceAuth::authorizePage'],
	['method'=>'get',  'endpoint'=>'/ice-auth/access-key',         'permissions'=>['internal'],  'IceAuth::accessKey'],
	['method'=>'get',  'endpoint'=>'/application/application-key', 'permissions'=>['internal'],  'Application::applicationKey'],
	['method'=>'get',  'endpoint'=>'/user',                        'permissions'=>['user-read'], 'User::show'],
	['method'=>'get',  'endpoint'=>'/user/timeline',               'permissions'=>['user-read'], 'User::timeline'],
	['method'=>'get',  'endpoint'=>'/post/timeline',               'permissions'=>['post-read'], 'Post::timeline'],
	['method'=>'post', 'endpoint'=>'/post/create',                 'permissions'=>['post-write'],'Post::create'],
	['method'=>'post', 'endpoint'=>'/application/regenerate-key',  'permissions'=>['internal'],  'Application::regenerateKey'],
	['method'=>'post', 'endpoint'=>'/account/create',              'permissions'=>['internal'],  'User::create'],
	['method'=>'post', 'endpoint'=>'/application/create',          'permissions'=>['internal'],  'Application::create'],
	['method'=>'post', 'endpoint'=>'/ice-auth/authorize',          'permissions'=>[],            'IceAuth::authorize']
];
