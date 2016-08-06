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
			$destUser = UserModel::getInstance($params['user-id'], $container);
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
