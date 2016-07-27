<?php
namespace Models;

class Application
{
	// 権限一覧
	public static $permissionTypes = [
		'ice-auth-host',       // 認証のホスト権限
		'application',         // 連携アプリ操作
		'application-special', // 連携アプリ特殊操作
		'account-read',        // アカウント情報の取得
		'account-write',       // アカウント情報の変更
		'account-special',     // アカウント情報の特殊操作
		'user-read',           // ユーザー情報の取得
		'user-write',          // ユーザーのフォロー等のアクション
		'post-read',           // 投稿の取得
		'post-write',          // 投稿の作成や削除等のアクション
	];

	public static function create($userId, $name, $description, array $requestedPermissions, $container)
	{
		$timestamp = time();
		$isPermissionError = false;
		$invalidPermissionNames = [];
		$permissions = [];

		foreach ($requestedPermissions as $requestedPermission)
		{
			$isFound = false;

			foreach (self::$permissionTypes as $permissionType)
			{
				if($requestedPermission === $permissionType)
				{
					$isFound = true;

					if (in_array($requestedPermission, $permissions))
						throw new \Utility\ApiException('permissions is duplicate');

					array_push($permissions, $requestedPermission);

					break;
				}
			}

			if (!$isFound)
			{
				$isPermissionError = true;
				$invalidPermissionNames += $requestedPermission;
			}
		}

		if ($isPermissionError)
			throw new \Utility\ApiException('unknown permissions', $invalidPermissionNames);

		try
		{
			$application = self::fetchByName($name, $container);
		}
		catch(\Utility\ApiException $e) { }

		if (isset($application))
			throw new \Utility\ApiException('already exists.');

		try
		{
			$application = $container->dbManager->transaction(function() use($container, $userId, $timestamp, $name, $description, $permissions) {
				$applicationTable = $container->config['db']['table-names']['application'];
				$container->dbManager->execute("insert into $applicationTable (creator_id, created_at, name, description, permissions) values(?, ?, ?, ?, ?)", [$userId, $timestamp, $name, $description, implode(',', $permissions)]);
				return $container->dbManager->executeFetch("select * from $applicationTable where creator_id = ? & name = ?", [$userId, $name])[0];
			});
		}
		catch(Exception $e)
		{
			throw new \Utility\ApiException('faild to create database record');
		}

		$key = self::generateKey($application['id'], $userId, $container);
		$application['key'] = $key;

		return $application;
	}

	public static function generateKey($id, $userId, $container)
	{
		$num = rand(1, 99999);
		$hash = strtoupper(hash('sha256', $container->config['application-key-base'].$userId.$id.$num));
		$application = self::fetch($id, $container);

		try
		{
			$applicationTable = $container->config['db']['table-names']['application'];
			$container->dbManager->execute("update $applicationTable set hash = ? where id = ?", [$hash, $id]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to create database record', ['application-key']);
		}

		return self::buildKey($id, $hash);
	}

	public static function fetch($id, $container)
	{
		try
		{
			$applicationTable = $container->config['db']['table-names']['application'];
			$apps = $container->dbManager->executeFetch("select * from $applicationTable where id = ?", [$id]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new \Utility\ApiException('application not found');

		return $apps[0];
	}

	public static function fetchByName($name, $container)
	{
		try
		{
			$applicationTable = $container->config['db']['table-names']['application'];
			$apps = $container->dbManager->executeFetch("select * from $applicationTable where name = ?", [$name]);
		}
		catch(PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch application');
		}

		if (count($apps) === 0)
			throw new \Utility\ApiException('application not found');

		return $apps[0];
	}

	public static function buildKey($id, $hash)
	{
		return $id.'-'.$hash;
	}

	public static function validate($applicationKey, $container)
	{
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64})/', $applicationKey);

		if ($match === null)
			return false;

		$applicationId = $match[1];
		$hash = $match[2];

		try
		{
			$application = self::fetch($applicationId, $container);
		}
		catch (\Utility\ApiException $e)
		{
			return false;
		}

		return $hash === $application['hash'];
	}
}
