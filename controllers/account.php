<?php

class AccountController
{
	public static function create($req, $res, $container, $user, $application)
	{
		$params = $req->getParams();
		$requireParams = ['screen-name', 'password'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		try
		{
			$userFactory = new UserFactory($container['database'], $container['config'], new \Utility\Regex());
			$accountModel = new AccountModel($userFactory);
			$user = $accountModel->create($params['screen-name'], $params['password'], $params['name']);
		}
		catch(\Utility\ApiException $e)
		{
			return withFailure($res, $e->getMessage(), $e->getData(), $e->getStatus());
		}

		return withSuccess($res, ['user' => $user]);
	}
}
