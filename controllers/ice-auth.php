<?php

class IceAuthController
{
	// ice-auth/create
	// リクエストを作成して、リクエストキーを取得
	public static function requestCreate(\Slim\Http\Request $req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['application-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$regex = new \Utility\Regex();
			$requestFactory = new RequestFactory($container['database'], $container['config'], $regex);
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], $regex);
			$applicationAccessFactory = new ApplicationAccessFactory($container['database'], $container['config'], $regex);
			$iceAuthModel = new IceAuthModel($requestFactory, $applicationFactory, $applicationAccessFactory);
			$requestKey = $iceAuthModel->createRequest($params['application-key']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['request-key' => $requestKey]);
	}

	// ice-auth/pin-code
	// PINコードを取得
	public static function pinCodeShow(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['request-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$regex = new \Utility\Regex();
			$requestFactory = new RequestFactory($container['database'], $container['config'], $regex);
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], $regex);
			$applicationAccessFactory = new ApplicationAccessFactory($container['database'], $container['config'], $regex);
			$iceAuthModel = new IceAuthModel($requestFactory, $applicationFactory, $applicationAccessFactory);
			$pinCode = $iceAuthModel->getPinCode();
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['pin-code' => $pinCode]);
	}

	// ice-auth/authorize
	// 認証を行って指定アプリケーションのアクセスキーを取得
	public static function authorize(\Slim\Http\Request $req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['request-key', 'user-id', 'pin-code'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$regex = new \Utility\Regex();
			$requestFactory = new RequestFactory($container['database'], $container['config'], $regex);
			$applicationFactory = new ApplicationFactory($container['database'], $container['config'], $regex);
			$applicationAccessFactory = new ApplicationAccessFactory($container['database'], $container['config'], $regex);
			$iceAuthModel = new IceAuthModel($requestFactory, $applicationFactory, $applicationAccessFactory);
			$accessKey = $iceAuthModel->authorize($params['request-key'], $params['user-id'], $params['pin-code']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['access-key' => $accessKey]);
	}
}
