<?php

$config = [
	'access-key-base' => 'keybase1',
	'application-key-base' => 'keybase2',
	'request-key-base' => 'keybase3',
	'user-key-base' => 'keybase4',
	'request-key-expire-sec' => 60 * 5,
	'db' => [
		'hostname' => 'your-database-hostname',
		'dbname' => 'your-database-name',
		'username' => 'your-database-username',
		'password' => 'your-database-password',
		'table-names' => [
			'user' => 'frost_user',
			'application' => 'frost_application',
			'application-access' => 'frost_application_access',
			'post' => 'frost_post'
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
