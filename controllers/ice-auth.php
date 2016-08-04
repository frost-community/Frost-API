<?php

class IceAuthController
{
	// ice-auth/create
	// リクエストを作成して、リクエストキーを取得
	public static function requestCreate($req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['application-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$request = RequestModel::create($params['application-id'], $container);
		$request->generatePinCode();
		$requestKey = $request->generateRequestKey();

		return $requestKey;
	}

	// ice-auth/pin-code
	// PINコードを取得
	public static function pinCodeShow($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['request-key'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestModel::verifyKey($params['request-key'], $container))
			return withFailure($res, 'parameters are invalid', ['request-key']);

		$request = RequestModel::getByKey($params['request-key'], $container);
		$pinCode = $request->pin_code;

		return withSuccess($res, ['pin-code'=>$pinCode]);
	}

	// ice-auth/authorize
	// 認証を行って指定アプリケーションのアクセスキーを取得
	public static function accessKeyAuth($req, $res, $container)
	{
		$params = $req->getParams();
		$requireParams = ['request-key', 'user-id', 'pin-code'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		if (!RequestModel::verifyKey($params['request-key'], $container))
			return withFailure($res, 'parameter is invalid', ['request-key']);

		$request = RequestModel::getByKey($params['request-key'], $container);

		if ($request->pin_code !== $params['pin-code'])
			return withFailure($res, 'parameter is invalid', ['pin-code']);

		$application = $request->application();
		$access = ApplicationAccessModel::where('application_id', $application->id)->where('user_id', $params['user-id'])->find_one();

		if (!$access)
		{
			$access = ApplicationAccessModel::create($application->id, $params['user-id'], $container);
			$access->generateAccessKey($params['user-id']);
		}

		$accessKey = $access->accessKey($params['user-id']);

		return withSuccess($res, ['access-key'=>$accessKey]);
	}
}
