<?php

class UserController
{
	public static function show($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$regex = new \Utility\Regex();
			$userFactory = new UserFactory($container['database'], $container['config'], $regex);
			$userFollowingFactory = new UserFollowingFactory($container['database'], $container['config'], $regex);
			$userModel = new UserModel($userFactory, $userFollowingFactory);
			$destUser = $userModel->get($urlArguments['id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['user'=>$destUser]);
	}

	public static function followings($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		// TODO
	}

	public static function followers($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		// TODO
	}

	public static function timeline($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		// TODO
	}

	public static function followCreate($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$regex = new \Utility\Regex();
			$userFactory = new UserFactory($container['database'], $container['config'], $regex);
			$userFollowingFactory = new UserFollowingFactory($container['database'], $container['config'], $regex);
			$userModel = new UserModel($userFactory, $userFollowingFactory);
			$userModel->follow($user->record->id, $urlArguments['id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res);
	}

	public static function followDestroy($req, $res, $container, $user, $application)
	{
		$urlArguments = $container['url-arguments'];

		try
		{
			$regex = new \Utility\Regex();
			$userFactory = new UserFactory($container['database'], $container['config'], $regex);
			$userFollowingFactory = new UserFollowingFactory($container['database'], $container['config'], $regex);
			$userModel = new UserModel($userFactory, $userFollowingFactory);
			$userModel->unfollow($user->record->id, $urlArguments['id']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res);
	}
}
