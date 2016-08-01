<?php

// APIにアクセスするためのアプリケーションを管理します
class ApplicationModel
{
	// 操作対象のApplicationレコード
	private $applicationData;

	// コンテナー
	private $container;

	// クラスの新しいインスタンスを初期化し、データベースのレコードを作成します
	public function __construct($applicationData, $container)
	{
		if (!$applicationData || !$container)
			throw new Exception('some arguments are empty');

		$this->container = $container;
		$this->applicationData = $applicationData;
	}

	// データベースのレコードを作成し、インスタンスを取得します
	public static function createRecord($userId, $name, $description, $requestedPermissions, $container)
	{
		if (!\Utility\Regex::isMatch('/^[a-z,-]+$/', $requestedPermissions))
			throw new \Utility\ApiException('format of permissions parameter is invalid', ['detail'=>'it is required to be constructed in "a" to "z", and ","']);

		$splitedPermissionsArray = explode(',', $requestedPermissions);

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
	public function generateKey($userId, $container)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($this->applicationData->creator_id !== $userId)
			throw new \Utility\ApiException('this key is managed by other user');

		$managementCode = rand(1, 99999);
		$key = self::buildKey($this->applicationData, $userId, $managementCode, $container);
		$keyHash = strtoupper(hash('sha256', $key));

		$this->applicationData->key_hash = $keyHash;
		$this->applicationData->management_code = $managementCode;

		return $key;
	}

	/*
	アプリケーションキーをデータベースから取得します
	*/
	public function getKey($accessUserId)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessUserId !== null && $this->applicationData->creator_id !== $accessUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		if ($this->applicationData->key_hash === null)
			throw new \Utility\ApiException('key is empty');

		return self::buildKey($this->applicationData->id, $this->applicationData->creator_id, $this->applicationData->management_code, $this->container);
	}

	// キーを構築します
	public static function buildKey($id, $userId, $managementCode, $container)
	{
		$hash = strtoupper(hash('sha256', "{$container->config['application-key-base']}/{$userId}/{$id}/{$managementCode}"));
		return "{$id}-{$hash}.{$managementCode}";
	}

	// アプリケーションキーを検証します
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

		$key = self::buildKey($id, $app->creator_id, $app->management_code, $container);
		$keyHash = strtoupper(hash('sha256', $key));

		return $keyHash === $app->key_hash;
	}

	// レスポンス向けの配列データに変換します
	public function toArrayResponse()
	{
		$app = $this->applicationData;
		$data = [
			'created_at' => $app->created_at,
			'creator_id' => $app->creator_id,
			'name' => $app->name,
			'description' => $app->description,
			'permissions' => $app->permissions,
			'key_hash' => $app->key_hash,
			'management_code' => $app->management_code
		];

		return $data;
	}
}
