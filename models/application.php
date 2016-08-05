<?php

/**
 * APIにアクセスするためのアプリケーションのインスタンスを管理します
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
	 * @param object $container コンテナー
	 * @throws \Utility\ApiException
	 * @throws \Exception
	 */
	public static function createInstance($userId, $name, $description, $requestedPermissions, $container)
	{
		if ($userId === null || $description === null || $requestedPermissions === null || $container === null)
			throw new \Exception('argument is empty');

		if (!\Utility\Regex::isMatch('/^[a-z,-]+$/', $requestedPermissions))
			throw new \Utility\ApiException('format of permissions parameter is invalid', ['detail'=>'it is required to be constructed in "a" to "z", and ","']);

		if (!self::getInstanceWithFilters(['name', $name], $container))
			throw new \Utility\ApiException('already exists.');

		$permissions = self::analyzePermission(explode(',', $requestedPermissions));
		$app = ApplicationModel::create();
		$app->container = $container;
		$app->created_at = time();
		$app->creator_id = $userId;
		$app->name = $name;
		$app->description = $description;
		$app->permissions = implode(',', $permissions);
		$app->save();

		return $app;
	}

	private static function getQueryWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('some arguments are empty');

		$query = Model::factory(__class__);

		foreach($wheres as $key => $value)
			$query = $query->where($key, $value);

		return $query;
	}

	public static function getInstanceWithFilters(array $wheres, $container)
	{
		if ($container === null)
			throw new \Exception('some arguments are empty');

		$query = self::getQueryWithFilters($wheres);
		$instance = $query->find_one();
		$instance->container = $container;

		return $instance;
	}

	public static function getInstancesWithFilters(array $wheres, $container)
	{
		if ($container === null)
			throw new \Exception('some arguments are empty');

		$query = self::getQueryWithFilters($wheres);
		$instance = $query->find_many();
		$instance->container = $container;

		return $instance;
	}

	public static function getInstance($id, $container)
	{
		return self::getInstanceWithFilters(['id'=>$id], $container);
	}

	/**
	 * このアプリケーションに対するRequestレコードを取得します
	 */
	public function requests()
	{
		return RequestModel::where('application_id', $this->id)->find_many();
	}

	/**
	 * このアプリケーションに対するApplicationAccessレコードを取得します
	 */
	public function accesses()
	{
		return ApplicationAccessModel::where('application_id', $this->id)->find_many();
	}

	/**
	 * 権限情報を配列としてデータベースから取得または値を設定します。引数にnullを与えると取得モードになります。
	 *
	 * @param array $value 設定する値
	 * @throws \Exception
	 * @return array 取得モード時は権限情報
	 */
	public function permissionsArray(array $value = null)
	{
		if ($value === null)
		{
			// get
			$permissionsArray = explode(',', $this->permissions);

			return $permissionsArray;
		}
		else
		{
			// set
			if (!is_array($value))
				throw new \Exception('argument type is invalid');

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

		return in_array($permissionName, $this->permissionsArray());
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
			// 自分のアプリケーションのキー以外は拒否
			if (intval($this->creator_id) !== intval($accessedUserId))
				throw new \Utility\ApiException('this key is managed by other user');
		}

		$keyCode = random_int(1, 99999);
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
			// 自分のアプリケーションのキー以外は拒否
			if (intval($this->creator_id) !== intval($accessedUserId))
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
	 * @param object $container コンテナー
	 * @throws \Exception
	 * @return string キーを構成するために必要なハッシュ
	 */
	private static function buildHash($id, $userId, $keyCode, $container)
	{
		if ($id === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('argument is empty');

		return strtoupper(hash('sha256', "{$container->config['application-key-base']}/{$userId}/{$id}/{$keyCode}"));
	}

	/**
	 * アプリケーションキーを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @param object $container コンテナー
	 * @return string アプリケーションキー
	 */
	private static function buildKey($id, $userId, $keyCode, $container)
	{
		if ($id === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('argument is empty');

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

		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			throw new \Utility\ApiException('application-key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * アプリケーションキーを検証します
	 *
	 * @param string $applicationKey アプリケーションキー
	 * @param object $container コンテナー
	 * @throws \Exception
	 * @return bool キーが有効であるかどうか
	 */
	public static function verifyKey($applicationKey, $container)
	{
		if ($applicationKey === null || $container === null)
			throw new \Exception('argument is empty');

		$parseResult = self::parseKeyToArray($applicationKey);
		$app = ApplicationModel::getInstance($parseResult['id'], $container);

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
