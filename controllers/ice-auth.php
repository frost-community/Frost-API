<?php

class IceAuth
{
	// 内部用 指定アプリケーションのアクセスキー取得
	public static function accessKeyShow($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Application::validate($params['application-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['application-key']);

		$appId = explode('-', $params['application-key'])[0];

		try
		{
			$applicationAccess = \Models\ApplicationAccess::fetch($appId, $user['id'], $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, 'access-key is empty. please try generate key');
		}

		$accessKey = buildKey($applicationAccess['user_id'], $applicationAccess['hash']);

		return withSuccess($res, ['access-key'=>$accessKey]);
	}

	// 内部用 指定アプリケーションのアクセスキー生成
	public static function accessKeyGenerate($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Application::validate($params['application-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['application-key']);

		$appId = explode('-', $params['application-key'])[0];
		$applicationAccess = \Models\ApplicationAccess::create($appId, $user['id'], $container);
		$accessKey = buildKey($applicationAccess['user_id'], $applicationAccess['hash']);

		return withSuccess($res, ['access-key'=>$accessKey]);
	}

	// 認証を行って指定アプリケーションのアクセスキーを取得
	public static function accessKeyAuth($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['application-key', 'pin-code'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!\Models\Application::validate($params['application-key'], $container->config, $container->dbManager))
			return withFailure($res, 'parameters are invalid', ['application-key']);

		// TODO: pin-codeを比較

		$appId = explode('-', $params['application-key'])[0];

		try
		{
			$applicationAccess = \Models\ApplicationAccess::fetch($appId, $user['id'], $container);
		}
		catch(\Utility\ApiException $e) { }

		if ($applicationAccess == null)
			$applicationAccess = \Models\ApplicationAccess::create($appId, $user['id'], $container);

		$accessKey = buildKey($applicationAccess['user_id'], $applicationAccess['hash']);

		return withSuccess($res, ['access-key'=>$accessKey]);
	}

	public static function requestKey($req, $res, $container)
	{
		// TODO: request-keyとpin-codeを発行
	}
}
