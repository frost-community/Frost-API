<?php

class IceAuth
{
	public static function accessKey($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();

		$requireParams = ['application-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Application::validate($params['application-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['application-key']);

		$appId = explode('-', $params['application-key'])[0];

		$applicationAccess = \Models\ApplicationAccess::create($user['id'], $appId, $container);

		$accessKey = buildKey($applicationAccess['user_id'], $applicationAccess['hash']);

		if (count($applicationAccess) !== 0 )
			return withFailure($res, 'already registered');

		return withSuccess($res, ['access-key'=>$accessKey]);
	}

	public static function requestKey($req, $res, $container)
	{
		// TODO
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
