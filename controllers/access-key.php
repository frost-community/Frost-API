<?php

require_once __DIR__.'/../util/api-exception.php';
require_once __DIR__.'/../util/api-utils.php';
require_once __DIR__.'/../util/regex.php';

class AccessKey
{
	public static function register($req, $res, $container)
	{
		$params = $req->getParams();

		$requireParams = ['access_key', 'app_name', 'user_id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if ($params['app_name'] !== 'web')
		{
			// TODO
			return withFailure($res, 'parameters are invalid', ['app_name']);
		}

		$correctAccessKey = $params['user_id'].'-'.hash('sha256', $container->config['access-key-base'].'.'.$params['app_name'].'.'.$params['user_id']);

		if ($correctAccessKey !== $params['access_key'])
			return withFailure($res, 'parameters are invalid', ['access_key']);

		$now = time();

		$applicationAccess = $container->dbManager->executeQuery('select * from frost_application_access where access_key = ? limit 1', [$params['access_key']])->fetch();

		if (count($applicationAccess) !== 0 )
			return withFailure($res, 'already registered');

		$container->dbManager->executeQuery('insert into frost_application_access(created_at, app_name, user_id, access_key) values(?, ?, ?, ?)', [$now, $params['app_name'], $params['user_id'], $params['access_key']]);

		return withSuccess($res);
	}
}
