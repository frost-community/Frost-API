<?php
namespace Models;

class User
{
	// ユーザーを生成します
	public static function create($screenName, $password, $name, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;
		$isOccurredError = false;
		$errorTargets = [];

		if (!\Utility\Regex::isMatch('/^[a-z0-9_]{4,15}$/i', $screenName) || \Utility\Regex::isMatch('/^(.)\1{3,}$/', $screenName))
		{
			$isOccurredError = true;
			$errorTargets[]  = 'screen-name';
		}
		else
		{
			$userTable   = $config['db']['table-names']['user'];
			$isExistUser = count($db->executeFetch("select * from $userTable where screen_name = ? limit 1", [$screenName])) === 1;

			if ($isExistUser)
			{
				$isOccurredError = true;
				$errorTargets[]  = 'screen-name';
			}
			else
			{
				foreach ($config['invalid-screen-names'] as $i)
				{
					if ($screenName === $i)
					{
						$isOccurredError = true;
						$errorTargets[] = 'screen-name';
					}
				}
			}
		}

		if (!\Utility\Regex::isMatch('/^[a-z0-9_-]{6,128}$/i', $password))
		{
			$isOccurredError = true;
			$errorTargets[] = 'password';
		}

		if ($isOccurredError)
			throw new \Utility\ApiException('parameters are invalid', $errorTargets);

		$now = time();
		$passwordHash = hash('sha256', $password.$now);
		$userTable = $config['db']['table-names']['user'];

		try
		{
			$db->execute("insert into $userTable (created_at, screen_name, name, password_hash) values(?, ?, ?, ?)", [$now, $screenName, $name, $passwordHash]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to create database record');
		}

		$user = $db->executeFetch("select * from $userTable where screen_name = ? limit 1", [$screenName])[0];

		return $user;
	}

	public static function fetch($id, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		try
		{
			$userTable = $config['db']['table-names']['user'];
			$user = $db->executeFetch("select * from $userTable where id = ?", [$id])[0];
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch user');
		}

		if ($user === null)
			throw new \Utility\ApiException('user not found');

		return $user;
	}
}
