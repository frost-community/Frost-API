<?php

// key-baseは各種キーのSecret Keyです。

$config = [
	'access-key-base' => 'keybase1',
	'application-key-base' => 'keybase2',
	'request-key-base' => 'keybase3',
	'request-key-expire-sec' => 60 * 5,
	'csrf-key-base' => 'keybase5',
	'db' => [
		'hostname' => 'localhost',
		'dbname' => 'frost',
		'username' => 'root',
		'password' => '',
		'table-names' => [
			'user' => 'frost_user',
			'application' => 'frost_application',
			'application-access' => 'frost_application_access',
			'post' => 'frost_post',
			'request' => 'frost_request'
		]
	],
	'invalid-screen-names' => [
		'frost',
		'help',
		'home',
		'mentions',
		'login',
		'logout',
		'search',
		'signin',
		'signup',
		'signout',
		'welcome',
		'static',
		'application',
		'developer'
	]
];
