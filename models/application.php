<?php
namespace Models;

class Application
{
	// 権限一覧
	public static $permissionTypes = [
		'internal',			// 内部APIへのアクセス
		'account-read',		// アカウント情報の取得
		'account-write',	// アカウント情報の変更
		'user-read',		// ユーザー情報の取得
		'user-write',		// フォローやブロック等のアクション
		'post-read',		// 投稿の取得
		'post-write',		// 投稿の作成・削除、投稿へのアクション
	];

	public static function create($userId, $name, $description, array $permissions, $config, DatabaseManager $db)
	{
		$now = time();

		$isPermissionError = false;
		$invalidPermissionNames = [];
		$permissions2 = [];
		foreach ($permissions as $permission)
		{
			$isFound = false;
			for ($i=0; $i < count($permissionTypes); $i++)
			{
				if($permission === $permissionTypes[$i])
				{
					$isFound = true;
					if (in_array($permission, $permissions2))
						throw new ApiException('permissions is duplicate');

					$permissions2 += $permission;
					break;
				}
			}

			if (!$isFound)
			{
				$isPermissionError = true;
				$invalidPermissionNames += $permission;
			}
		}

		if ($isPermissionError)
			throw new ApiException('unknown permissions', $invalidPermissionNames);

		try
		{
			$application = Application::fetchByName($name);
		}
		catch(ApiException $e)
		{
		}

		if (isset($application))
			throw new ApiException('already exists.');

		try
		{
			$db->executeQuery('insert into frost_application (creator_id, created_at, name, description, permissions) values(?, ?, ?, ?)', [$userId, $now, $name, $description, implode(',', $permissions)]);
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to create database record');
		}

		$application = $db->executeQuery('select * from frost_application where creator_id = ? & name = ?', [$userId, $name])->fetch()[0];

		$key = ApplicationKey::create($application['id'], $config, $db);

		$application['key'] = $key;

		return $application;
	}

	public static function fetch($id, DatabaseManager $db)
	{
		try
		{
			$apps = $db->executeQuery('select * from frost_application where id = ?', [$id])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new ApiException('application not found');

		return $apps[0];
	}

	public static function fetchByName($name, DatabaseManager $db)
	{
		try
		{
			$apps = $db->executeQuery('select * from frost_application where name = ?', [$name])->fetch();
		}
		catch(PDOException $e)
		{
			throw new ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new ApiException('application not found');

		return $apps[0];
	}
}
