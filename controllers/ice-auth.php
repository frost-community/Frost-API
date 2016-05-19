<?php

class IceAuth
{
	public static function accessKey($req, $res, $container)
	{
		// params: [resuqst-key, application-key]
		// return: access-key

		$params = $req->getParams();

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

		$applicationAccess = $container->dbManager->executeQuery('select * from frost_application_access where access_key = ? limit 1', [$accessKey])->fetch();

		if (count($applicationAccess) !== 0 )
			return withFailure($res, 'already registered');

		// TODO
		$container->dbManager->executeQuery('insert into frost_application_access (created_at, app_id, user_id, access_key) values(?, ?, ?, ?)', [$now, $appId, $userId, $accessKey]);

		return withSuccess($res, 'successful', ['access-key'=>$accessKey]);
	}

	public static function authorizePage($req, $res, $container)
	{
		// TODO
		// params: [application-key]
		// return: view 認証ページ
	}

	public static function authorize($req, $res, $container)
	{
		// TODO
		// バリデーション
	}
}
