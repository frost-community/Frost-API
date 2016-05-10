<?php

class IceAuth
{
	// Frost-Web側 authorize
	// params: [app_key]
	// return: view 認証ページ

	public static function accesskey($params, $res, $container)
	{
		// TODO
		// POST
		// params: [app_key, user_id]
		// return: access_key

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if ($params['application_id'] !== 'web')
		{
			// TODO
			return withFailure($res, 'parameters are invalid', ['app_name']);
		}

		$correctAccessKey = createAccesskey($_SESSION['application_id'], $_SESSION['user_id'], $container);

		if ($correctAccessKey !== $params['access_key'])
			return withFailure($res, 'parameters are invalid', ['access_key']);

		$now = time();

		$applicationAccess = $container->dbManager->executeQuery('select * from frost_iceauth_accesskey where access_key = ? limit 1', [$params['access_key']])->fetch();

		if (count($applicationAccess) !== 0 )
			return withFailure($res, 'already registered');

		$container->dbManager->executeQuery('insert into frost_iceauth_accesskey (created_at, app_name, user_id, access_key) values(?, ?, ?, ?)', [$now, $params['app_name'], $params['user_id'], $params['access_key']]);

		return withSuccess($res);
	}
}
