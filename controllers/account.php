<?php

class Account
{
	public static function create($req, $res, $appName, $userId, $container)
	{
		$params = $req->getParams();

		$requireParams = ['screen-name', 'password'];

		if (!hasRequireParams($params, $requireParams))
			return withFailure($res, 'required parameters are missing', $requireParams);

		$invalidSN = [
			'frost',
			'help',
			'home',
			'mentions',
			'login',
			'logout',
			'search',
			'signin',
			'signup',
			'signout',
			'welcome',
			'static',
			'application',
			'developer',
		];

		$isOccurredError = false;
		$errorTargets = [];

		if (!Regex::isMatch('/^[a-z0-9_]{4,15}$/i', $params['screen-name']) || Regex::isMatch('/(.)\1{3,}/', $params['screen-name']))
		{
			$isOccurredError = true;
			$errorTargets[] = 'screen-name';
		}
		else
		{
			$isExistUser = count($container->dbManager->executeQuery('select * from frost_account where screen_name = ? limit 1', [$params['screen-name']])->fetch()) === 1;

			if ($isExistUser)
			{
				$isOccurredError = true;
				$errorTargets[] = 'screen-name';
			}
			else
			{
				foreach ($invalidSN as $i)
				{
					if ($params['screen-name'] === $i)
					{
						$isOccurredError = true;
						$errorTargets[] = 'screen-name';
					}
				}
			}
		}

		if (!Regex::isMatch('/^[a-z0-9_-]{6,128}$/i', $params['password']))
		{
			$isOccurredError = true;
			$errorTargets[] = 'password';
		}

		if ($isOccurredError)
			return withFailure($res, 'parameters are invalid', $errorTargets);

		$createdAt = time();
		$passwordHash = hash('sha256', $params['password'].$createdAt);
		$container->dbManager->executeQuery('insert into frost_account (created_at, screen_name, name, password_hash) values(?, ?, ?, ?)', [$createdAt, $params['screen-name'], "froster", $passwordHash]);

		$user = $container->dbManager->executeQuery('select * from frost_account where screen_name = ? limit 1', [$params['screen-name']])->fetch();

		return withSuccess($res);
	}
}
