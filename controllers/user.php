<?php

class UserController
{
	public static function show($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['user-id'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$userFactory = new UserFactory($container['database'], $container['config'], new \Utility\Regex());
			$userModel = new UserModel($userFactory);
			$destUser = $userModel->get($params['user-id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['user'=>$destUser]);
	}

	public static function followings($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function followers($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function timeline($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function followCreate($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function followDestroy($req, $res, $container, $user, $application)
	{
		// TODO
	}
}
