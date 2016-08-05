<?php

class UserController
{
	/**
	 * @param $req
	 * @param $res
	 * @param $container
	 * @param $user
	 * @param $application
	 * @return mixed
	 * @throws \Utility\ApiException
	 */
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['screen-name', 'password'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$createdUser = UserModel::createInstance($params['screen-name'], $params['password'], 'froster', $container);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['user'=>$createdUser]);
	}

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
	
	public static function timeline($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function follow($req, $res, $container, $user, $application)
	{
		// TODO
	}

	public static function unfollow($req, $res, $container, $user, $application)
	{
		// TODO
	}
}
