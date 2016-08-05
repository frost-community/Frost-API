<?php

class IceAuthController
{
	// ice-auth/create
	// リクエストを作成して、リクエストキーを取得
	public static function requestCreate(\Slim\Http\Request $req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$request = RequestModel::createInstance($params['application-id'], $container);
		$request->generatePinCode();
		$requestKey = $request->generateRequestKey();

		return $requestKey;
	}

	// ice-auth/pin-code
	// PINコードを取得
	public static function pinCodeShow(\Slim\Http\Request $req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['request-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestModel::verifyKey($params['request-key'], $container))
			return withFailure($res, 'parameters are invalid', ['request-key']);

		$parseResult = RequestModel::parseKeyToArray($params['request-key']);
		$request = RequestModel::getInstanceWithFilters(['id' => $parseResult['id'], 'key_code' => $parseResult['keyCode']], $container);

		return withSuccess($res, ['pin-code'=>$request->pin_code]);
	}

	// ice-auth/authorize
	// 認証を行って指定アプリケーションのアクセスキーを取得
	public static function accessKeyAuth(\Slim\Http\Request $req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['request-key', 'user-id', 'pin-code'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestModel::verifyKey($params['request-key'], $container))
			return withFailure($res, 'parameter is invalid', ['request-key']);

		$parseResult = RequestModel::parseKeyToArray($params['request-key']);
		$request = RequestModel::getInstanceWithFilters(['id' => $parseResult['id'], 'key_code' => $parseResult['keyCode']], $container);

		if ($request->pin_code !== $params['pin-code'])
			return withFailure($res, 'parameter is invalid', ['pin-code']);

		$application = $request->application();
		$access = ApplicationAccessModel::getInstanceWithFilters(['user_id' => $params['user-id'], 'application_id' => $application['id']], $container);

		if (!$access)
		{
			$access = ApplicationAccessModel::createInstance($application->id, $params['user-id'], $container);
			$access->generateAccessKey($params['user-id']);
		}

		$accessKey = $access->accessKey($params['user-id']);

		return withSuccess($res, ['access-key'=>$accessKey]);
	}
}
