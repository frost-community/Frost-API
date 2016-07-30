<?php

class Application extends Model
{
	public static $_table = 'test_application';
	public static $_id_column = 'id';

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
		$app = parent::create();

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

		if (!Model::factory('Application')->where('name', $name)->find_many())
			throw new \Utility\ApiException('already exists.');

		$app->created_at = $timestamp;
		$app->creator_id = $userId;
		$app->name = $name;
		$app->description = $description;
		$app->permissions = implode(',', $permissions);

		return $app;
	}

	public function generateKey($id, $userId, $container)
	{
		$num = rand(1, 99999);
		$key = self::buildKey($id, $userId, $num, $container);
		$keyHash = strtoupper(hash('sha256', $key));
		$this->hash = $keyHash;

		return $key;
	}

	public static function buildKey($id, $userId, $num, $container)
	{
		$hash = strtoupper(hash('sha256', "{$container->config['application-key-base']}/{$userId}/{$id}/{$num}"));
		return "{$id}-{$hash}.{$num}";
	}

	public static function validate($applicationKey, $container)
	{
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			return false;

		$applicationId = $match[1];
		$hash = $match[2];
		$num = $match[3];

		$app = Model::factory('Application')->find_one($applicationId);

		if (!$app)
			return false;

		$key = self::buildKey($applicationId, $app->creator_id, $num, $container);
		$keyHash = strtoupper(hash('sha256', $key));

		return $keyHash === $app->hash;
	}

	public function requests()
	{
		return $this->has_many('Request', 'id');
	}
}
