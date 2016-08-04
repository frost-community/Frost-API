<?php

/**
 * APIにアクセスするためのアプリケーションを管理します
 */
class ApplicationModel extends Model
{
	public static $_table = 'frost_application';
	public static $_id_column = 'id';

	/**
	 * コンテナー
	 */
	private $container;

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
	 * 新しいレコードを作成してインスタンスを初期化します
	 *
	 * @param int $userId ユーザーのID
	 * @param string $name 名前
	 * @param string $description 説明
	 * @param string $requestedPermissions 要求する権限
	 * @param array $container コンテナー
	 * @throws \Utility\ApiException
	 * @throws \Exception
	 */
	public static function create($userId, $name, $description, $requestedPermissions, array $container)
	{
		if ($userId === null || $description === null || $requestedPermissions === null || $container === null)
			throw new \Exception('argument is empty');

		if (!is_int($userId) || !is_string($description) || !is_string($requestedPermissions) || !is_array($container))
			throw new \Exception('argument type is invalid');

		if (!\Utility\Regex::isMatch('/^[a-z,-]+$/', $requestedPermissions))
			throw new \Utility\ApiException('format of permissions parameter is invalid', ['detail'=>'it is required to be constructed in "a" to "z", and ","']);

		if (!Model::factory('ApplicationModel')->where_equal('name', $name)->find_one())
			throw new \Utility\ApiException('already exists.');

		$permissions = self::analyzePermission(explode(',', $requestedPermissions));
		$app = Model::factory('ApplicationModel')->create();
		$app->container = $container;
		$app->created_at = time();
		$app->creator_id = $userId;
		$app->name = $name;
		$app->description = $description;
		$app->permissions = implode(',', $permissions);
		$app->save();

		return $app;
	}

	/**
	 * アプリケーションキーによってデータベースのレコードを検索し、インスタンスを取得します
	 *
	 * @param int $key アプリケーションキー
	 * @param array $container コンテナー
	 * @throws \Exception
	 * @return ApplicationModel 新しいインスタンス
	 */
	public static function getByKey($applicationKey, array $container)
	{
		if ($applicationKey === null || $container === null)
			throw new \Exception('argument is empty');

		if (!is_int($applicationKey) || !is_array($container))
			throw new \Exception('argument type is invalid');

		$parseResult = self::parseKeyToArray($applicationKey);
		$app = Model::factory('ApplicationModel')->find_one($parseResult['id']);
		$app->container = $container;

		return $app;
	}

	/**
	 * このアプリケーションに対するRequestレコードを取得します
	 */
	public function requests()
	{
		return $this->belongs_to('RequestModel', 'id');
	}

	/**
	 * このアプリケーションに対するApplicationAccessレコードを取得します
	 */
	public function accesses()
	{
		return $this->belongs_to('ApplicationAccessModel', 'id');
	}

	/**
	 * 権限情報を配列としてデータベースから取得または値を設定します。引数にnullを与えると取得モードになります。
	 *
	 * @param array $value 設定する値
	 * @throws \Exception
	 * @return array 取得モード時は権限情報
	 */
	public function permissionsArray($value = null)
	{
		if (!is_array($value))
			throw new \Exception('argument type is invalid');

		if ($value === null)
		{
			// get
			$permissionsArray = explode(',', $value);

			return $permissionsArray;
		}
		else
		{
			// set
			$permissions = implode(',', $value);
			$this->permissions = $permissions;
		}
	}

	/**
	 * 指定された権限を所持しているかどうかを取得します
	 *
	 * @param string $permissionName 対象の権限
	 * @throws \Exception
	 * @return bool その権限を所持しているかどうか
	 */
	public function isHasPermission($permissionName)
	{
		if ($permissionName === null)
			throw new \Exception('argument is empty');

		if (!is_string($applicationKey))
			throw new \Exception('argument type is invalid');

		return in_array($permissionName, $this->getPermissions());
	}

	/**
	 * 権限の内容を解析して内容の正当性を確認します
	 *
	 * @param array $permissions 権限の配列
	 * @throws \Utility\ApiException
	 * @return ApplicationModel 再構成された権限の配列
	 */
	private static function analyzePermissions(array $permissions)
	{
		if ($permissions === null)
			throw new \Exception('argument is empty');

		if (!is_array($permissions))
			throw new \Exception('argument type is invalid');

		$isPermissionError = false;
		$invalidPermissionNames = [];

		foreach ($permissions as $permission)
		{
			$isFound = false;

			foreach (self::$permissionTypes as $permissionType)
			{
				if($permission === $permissionType)
				{
					$isFound = true;

					if (in_array($permission, $destPermissions))
						throw new \Utility\ApiException('permissions is duplicate');

					array_push($destPermissions, $permission);
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
			throw new \Utility\ApiException('unknown permissions', $invalidPermissionNames);
		
		return $destPermissions;
	}

	/**
	 * アプリケーションキーを生成します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function generateApplicationKey($accessedUserId = null)
	{
		if ($accessedUserId !== null)
		{
			if (!is_int($accessedUserId))
				throw new \Exception('argument type is invalid');

			// 自分のアプリケーションのキー以外は拒否
			if ($this->creator_id !== $accessedUserId)
				throw new \Utility\ApiException('this key is managed by other user');
		}

		$keyCode = rand(1, 99999);
		$this->key_code = $keyCode;
		$this->save();

		return $this->applicationKey($accessedUserId);
	}

	/**
	 * アプリケーションキーを取得します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function applicationKey($accessedUserId = null)
	{
		if ($accessedUserId !== null)
		{
			if (!is_int($accessedUserId))
				throw new \Exception('argument type is invalid');

			// 自分のアプリケーションのキー以外は拒否
			if ($this->creator_id !== $accessedUserId)
				throw new \Utility\ApiException('this key is managed by other user');
		}

		if ($this->key_code === null)
			throw new \Utility\ApiException('key is empty');

		return self::buildKey($this->id, $this->creator_id, $this->key_code, $this->container);
	}

	/**
	 * キーを構成するために必要なハッシュを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @param array $container コンテナー
	 * @throws \Exception
	 * @return string キーを構成するために必要なハッシュ
	 */
	private static function buildHash($id, $userId, $keyCode, array $container)
	{
		if ($id === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('argument is empty');

		if (!is_int($id) || !is_int($userId) || !is_int($keyCode) || !is_array($container))
			throw new \Exception('argument type is invalid');

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
	private static function buildKey($id, $userId, $keyCode, array $container)
	{
		if ($id === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('argument is empty');

		if (!is_int($id) || !is_int($userId) || !is_int($keyCode) || !is_array($container))
			throw new \Exception('argument type is invalid');

		$hash = self::buildHash($id, $userId, $keyCode, $container);
		$applicationKey = "{$id}-{$hash}.{$keyCode}";

		return $applicationKey;
	}

	/**
	 * アプリケーションキーを配列に展開します
	 * @param string $key アプリケーションキー
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return array id,hash,keyCodeの格納された配列
	 */
	public static function parseKeyToArray($applicationKey)
	{
		if ($applicationKey === null)
			throw new \Exception('argument is empty');

		if (!is_string($applicationKey))
			throw new \Exception('argument type is invalid');

		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			throw new \Utility\ApiException('application-key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * アプリケーションキーを検証します
	 *
	 * @param string $applicationKey アプリケーションキー
	 * @param array $container コンテナー
	 * @throws \Exception
	 * @return bool キーが有効であるかどうか
	 */
	public static function verifyKey($applicationKey, array $container)
	{
		if ($applicationKey === null || $container === null)
			throw new \Exception('argument is empty');

		if (!is_string($applicationKey) || !is_array($container))
			throw new \Exception('argument type is invalid');

		$parseResult = self::parseKeyToArray($applicationKey);
		$app = Model::factory('ApplicationModel')->find_one($parseResult['id']);

		if (!$app)
			return false;

		$correctHash = self::buildHash($parseResult['id'], $app->creator_id, $parseResult['keyCode'], $container);
		$isPassed = $parseResult['keyCode'] === $app->key_code && $parseResult['hash'] === $correctHash;

		return $isPassed;
	}

	/**
	 * レスポンス向けの配列データに変換します
	 *
	 * @return array レスポンス向けの配列データ
	 */
	public function toArrayResponse()
	{
		$data = [
			'id' => $this->id,
			'created_at' => $this->created_at,
			'creator_id' => $this->creator_id,
			'name' => $this->name,
			'description' => $this->description,
			'permissions' => $this->permissions
		];

		return $data;
	}
}
