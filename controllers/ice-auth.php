<?php

class IceAuth
{
	// Frost-Web側 authorize
	// params: [app_key]
	// return: view 認証ページ

	public static function accesskey($params, $res, $container)
	{
		// params: [resuqst-key, app-key]
		// return: access-key

		$requireParams = ['resuqst-key', 'application-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestKey::validate($params['request-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['request-key']);

		$userId = explode('-', $params['request-key'])[0];

		if (!\Models\ApplicationKey::validate($params['application-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['application-key']);

		$appId = explode('-', $params['application-key'])[0];

		$accessKey = createAccesskey($appId, $userId, $container);

		$now = time();

		$applicationAccess = $container->dbManager->executeQuery('select * from frost_iceauth_accesskey where access_key = ? limit 1', [$accessKey])->fetch();

		if (count($applicationAccess) !== 0 )
			return withFailure($res, 'already registered');

		// TODO
		$container->dbManager->executeQuery('insert into frost_iceauth_accesskey (created_at, app_id, user_id, access_key) values(?, ?, ?, ?)', [$now, $appId, $userId, $accessKey]);

		return withSuccess($res, 'successful', ['access-key'=>$accessKey]);
	}
}
