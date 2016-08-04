<?php

/**
 * アプリケーションによるAPIアクセスを管理します
 */
class ApplicationAccessModel extends Model
{
	public static $_table = 'frost_application_access';
	public static $_id_column = 'id';

	/**
	 * コンテナー
	 */
	private $container;

	/**
	 * データベースのレコードを作成し、インスタンスを取得します
	 */
	public static function create($applicationId, $userId, $container)
	{
		if ($applicationId === null || $userId === null || $container === null)
			throw new Exception('some arguments are empty');

		$access = Model::factory('ApplicationAccessModel')->create();
		$access->container = $container;
		$access->created_at = time();
		$access->user_id = $userId;
		$access->application_id = $applicationId;
		$access->save();

		return $access;
	}

	/**
	 * アクセスキーによってデータベースのレコードを検索し、インスタンスを取得します
	 *
	 * @param int $accessKey アクセスキー
	 * @param array $container コンテナー
	 * @return ApplicationModel 新しいインスタンス
	 */
	public static function getByKey($accessKey, $container)
	{
		if ($accessKey === null || $container === null)
			throw new \Exception('some arguments are empty');

		$parseResult = self::parseKeyToArray($accessKey);
		$access = Model::factory('ApplicationAccessModel')
			->where_equal('user_id', $parseResult['id'])
			->where_equal('key_code', $parseResult['keyCode'])
			->find_one();
		$access->container = $container;

		return $access;
	}

	/**
	 * このインスタンスに紐付いているアプリケーションを取得します
	 */
	public function application()
	{
		return $this->has_one('ApplicationModel', 'id');
	}

	/**
	 * このインスタンスに紐付いているユーザーを取得します
	 */
	public function user()
	{
		return $this->has_one('UserModel', 'id');
	}

	/**
	 * アクセスキーを生成しハッシュを更新します
	 */
	public function generateAccessKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		// キーコードが重複していたら3回まで施行
		$tryCount = 0;
		do
		{
			$tryCount++;
			$keyCode = random_int(1, 99999);
			$isExist = Model::factory('ApplicationAccessModel')->where_equal('user_id', $this->user_id)->where_equal('key_code', $keyCode)->count() !== 0;
		} while ($isExist && $tryCount < 3);

		if ($isExist && $tryCount >= 3)
			throw new \Utility\ApiException('the number of trials for key_code generation has reached its upper limit');

		$this->key_code = $keyCode;
		$this->save();

		return $this->accessKey($accessedUserId);
	}

	/**
	 * アクセスキーを取得します
	 */
	public function accessKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		if ($this->key_code === null)
			throw new \Utility\ApiException('key is empty');

		return self::buildKey($this->application_id, $this->user_id, $this->key_code, $this->container);
	}

	/**
	 * アクセスキーに含まれるハッシュを構築します
	 */
	public static function buildHash($applicationId, $userId, $keyCode, $container)
	{
		if ($applicationId === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('some arguments are empty');

		return strtoupper(hash('sha256', "{$container->config['access-key-base']}/{$applicationId}/{$userId}/{$keyCode}"));
	}

	/**
	 * アクセスキーを構築します
	 */
	public static function buildKey($applicationId, $userId, $keyCode, $container)
	{
		if ($applicationId === null || $userId === null || $keyCode === null || $container === null)
			throw new \Exception('some arguments are empty');

		$hash = self::buildHash($applicationId, $userId, $keyCode, $container);

		return "{$userId}-{$hash}.{$keyCode}";
	}

	/**
	 * アクセスキーを配列に展開します
	 */
	public static function parseKeyToArray($accessKey)
	{
		if ($accessKey === null)
			throw new \Exception('some arguments are empty');

		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $accessKey);

		if ($match === null)
			throw new \Utility\ApiException('key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * アクセスキーを検証します
	 */
	public static function verifyKey($accessKey, $container)
	{
		if ($accessKey === null || $container === null)
			throw new \Exception('some arguments are empty');

		try
		{
			$parseResult = self::parseKeyToArray($accessKey);
		}
		catch(\Exception $e)
		{
			return false;
		}

		$access = Model::factory('ApplicationAccessModel')
			->where_equal('user_id', $parseResult['id'])
			->where_equal('key_code', $parseResult['keyCode'])
			->find_one();

		if (!$access)
			return false;

		$correctHash = self::buildHash($access->application_id, $parseResult['id'], $parseResult['keyCode'], $container);
		$isPassed = $parseResult['keyCode'] === $access->key_code && $parseResult['hash'] === $correctHash;

		return $isPassed;
	}
}
