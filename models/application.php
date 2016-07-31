<?php

// APIにアクセスするためのアプリケーションを管理します
class ApplicationModel
{
	// 操作対象のApplicationレコード
	private $ApplicationData;

	// コンテナー
	private $container;

	// クラスの新しいインスタンスを初期化し、データベースのレコードを作成します
	public function __construct($applicationData, $container)
	{
		if (!$applicationData || !$container)
			throw new Exception('some arguments are empty');

		$this->container = $container;
		$this->ApplicationData = $applicationData;
	}

	// データベースのレコードを作成し、インスタンスを取得します。
	public static function createRecord($userId, $name, $description, array $requestedPermissions, $container)
	{
		$app = Model::factory('ApplicationData')->create();

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

		if (!Model::factory('ApplicationData')->where('name', $name)->find_many())
			throw new \Utility\ApiException('already exists.');

		$app->created_at = $timestamp;
		$app->creator_id = $userId;
		$app->name = $name;
		$app->description = $description;
		$app->permissions = implode(',', $permissions);

		$app->save();

		return new ApplicationModel($app, $container);
	}

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

	/*
	アプリケーションキーを生成し、ハッシュを更新します
	データベースへのsaveはされません
	*/
	public static function generateKey($id, $userId, $container)
	{
		$managementCode = rand(1, 99999);
		$key = self::buildKey($id, $userId, $managementCode, $container);
		$keyHash = strtoupper(hash('sha256', $key));

		$app = Model::factory('ApplicationData')->find_one($id);
		$app->key_hash = $keyHash;
		$app->management_code = $managementCode;

		return $key;
	}

	/*
	アプリケーションキーをデータベースから取得します
	*/
	public function getKey()
	{
		return self::buildKey($this->ApplicationData->id, $this->ApplicationData->creator_id, $this->ApplicationData->management_code, $this->container);
	}

	// キーを構築する
	public static function buildKey($id, $userId, $managementCode, $container)
	{
		$hash = strtoupper(hash('sha256', "{$container->config['application-key-base']}/{$userId}/{$id}/{$managementCode}"));
		return "{$id}-{$hash}.{$managementCode}";
	}

	// アプリケーションキーを検証する
	public static function validateKey($applicationKey, $container)
	{
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			return false;

		$id = $match[1];
		$hash = $match[2];
		$managementCode = $match[3];

		$app = Model::factory('ApplicationData')->find_one($id);

		if (!$app)
			return false;

		$key = self::buildKey($id, $app->creator_id, $managementCode, $container);
		$keyHash = strtoupper(hash('sha256', $key));

		return $keyHash === $app->hash;
	}
}
