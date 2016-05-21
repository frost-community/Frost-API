<?php
namespace Models;

class User
{
	// ユーザーを生成します
	public static function create($screenName, $password, $name, $config, DatabaseManager $db)
	{
		$isOccurredError = false;
		$errorTargets = [];

		if (!Regex::isMatch('/^[a-z0-9_]{4,15}$/i', $screenName) || Regex::isMatch('/^(.)\1{3,}$/', $screenName))
		{
			$isOccurredError = true;
			$errorTargets[] = 'screen-name';
		}
		else
		{
			$isExistUser = count($db->executeQuery('select * from frost_user where screen_name = ? limit 1', [$screenName])->fetch()) === 1;

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

		if (!Regex::isMatch('/^[a-z0-9_-]{6,128}$/i', $password))
		{
			$isOccurredError = true;
			$errorTargets[] = 'password';
		}

		if ($isOccurredError)
			throw new ApiException('parameters are invalid', $errorTargets);

		$now = time();
		$passwordHash = hash('sha256', $password.$now);

		try
		{
			$db->executeQuery('insert into frost_user (created_at, screen_name, name, password_hash) values(?, ?, ?, ?)', [$now, $screenName, $name, $passwordHash]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$user = $db->executeQuery('select * from frost_user where screen_name = ? limit 1', [$screenName])->fetch();

		return $user;
	}

	public static function fetch($id, DatabaseManager $db)
	{
		try
		{
			$users = $db->executeQuery('select * from frost_user where user_id = ?', [$id])->fetch();
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
