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
			$errorTargets[] = 'screen-name';
		}
		else
		{
			$userTable = $config['db']['table-names']['user'];
			$isExistUser = count($db->executeQuery('select * from $userTable where screen_name = ? limit 1', [$screenName])->fetch()) === 1;

			if ($isExistUser)
			{
				$isOccurredError = true;
				$errorTargets[] = 'screen-name';
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
			throw new ApiException('parameters are invalid', $errorTargets);

		$now = time();
		$passwordHash = hash('sha256', $password.$now);

		$userTable = $config['db']['table-names']['user'];

		try
		{
			
			$db->executeQuery('insert into $userTable (created_at, screen_name, name, password_hash) values(?, ?, ?, ?)', [$now, $screenName, $name, $passwordHash]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$user = $db->executeQuery('select * from $userTable where screen_name = ? limit 1', [$screenName])->fetch();

		return $user;
	}

	public static function fetch($id, $container)
	{
		$config = $container->config;
		$db = $container->dbManager;

		try
		{
			$userTable = $config['db']['table-names']['user'];
			$users = $db->executeQuery('select * from $userTable where id = ?', [$id])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch user');
		}

		if (count($users) === 0)
			throw new ApiException('user not found');

		return $users[0];
	}
}
