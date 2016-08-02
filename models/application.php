<?php

/**
 * APIにアクセスするためのアプリケーションを管理します
 */
class ApplicationModel
{
	/**
	 * 操作対象のApplicationレコード
	 */
	private $applicationData;

	/**
	 * コンテナー
	 */
	private $container;

	/**
	 * クラスの新しいインスタンスを初期化します
	 *
	 * @param ApplicationData $applicationData 操作対象のApplicationレコード
	 * @param array $container コンテナー
	 * @throws \Exception
	 */
	public function __construct($applicationData, $container)
	{
		if ($applicationData === null || $container === null)
			throw new \Exception('some arguments are empty');

		$this->container = $container;
		$this->applicationData = $applicationData;
	}

	/**
	 * データベースのレコードを作成し、インスタンスを取得します
	 *
	 * @param int $userId ユーザーのID
	 * @param string $name 名前
	 * @param string $description 説明
	 * @param string $requestedPermissions 要求する権限
	 * @param array $container コンテナー
	 * @throws \Utility\ApiException
	 * @return ApplicationModel 新しいインスタンス
	 */
	public static function createRecord($userId, $name, $description, $requestedPermissions, $container)
	{
		if ($userId === null || $description === null || $requestedPermissions === null || $container === null)
			throw new \Exception('some arguments are empty');

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

	/**
	 * 権限一覧
	 */
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

	/**
	 * アプリケーションキーを生成します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function generateKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->applicationData->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		$keyCode = rand(1, 99999);
		$key = self::buildKey($this->applicationData->id, $this->applicationData->creator_id, $keyCode, $this->container);

		$this->applicationData->key_code = $keyCode;
		$this->applicationData->save();

		return $key;
	}

	/**
	 * アプリケーションキーをデータベースから取得します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function getKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->applicationData->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		if ($this->applicationData->key_code === null)
			throw new \Utility\ApiException('key is empty');

		return self::buildKey($this->applicationData->id, $this->applicationData->creator_id, $this->applicationData->key_code, $this->container);
	}

	/**
	 * キーを構成するために必要なハッシュを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @param array $container コンテナー
	 * @return string キーを構成するために必要なハッシュ
	 */
	public static function buildHash($id, $userId, $keyCode, $container)
	{
		return strtoupper(hash('sha256', "{$container->config['application-key-base']}/{$userId}/{$id}/{$keyCode}"));
	}

	/**
	 * アプリケーションキーを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @param array $container コンテナー
	 * @return string アプリケーションキー
	 */
	public static function buildKey($id, $userId, $keyCode, $container)
	{
		$hash = buildHash($id, $userId, $keyCode, $container);
		return "{$id}-{$hash}.{$keyCode}";
	}

	/**
	 * アプリケーションキーを検証します
	 *
	 * @param string $applicationKey アプリケーションキー
	 * @param array $container コンテナー
	 * @return bool キーが有効であるかどうか
	 */
	public static function validateKey($applicationKey, $container)
	{
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			return false;

		$id = $match[1];
		$hash = $match[2];
		$keyCode = $match[3];

		$app = Model::factory('ApplicationData')->find_one($id);

		if (!$app)
			return false;

		$correctHash = buildHash($id, $app->creator_id, $keyCode, $container);

		// key_codeが一致していて且つハッシュ値が正しいかどうか
		$isPassed = $keyCode === $app->key_code && $hash === $correctHash;

		return $isPassed;
	}

	/**
	 * レスポンス向けの配列データに変換します
	 *
	 * @return array レスポンス向けの配列データ
	 */
	public function toArrayResponse()
	{
		$app = $this->applicationData;
		$data = [
			'created_at' => $app->created_at,
			'creator_id' => $app->creator_id,
			'name' => $app->name,
			'description' => $app->description,
			'permissions' => $app->permissions
		];

		return $data;
	}
}
