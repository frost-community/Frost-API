<?php

class ApplicationAccessModel
{
	// 操作対象のApplicationAccessレコード
	private $applicationAccessData;

	// コンテナー
	private $container;

	// クラスの新しいインスタンスを初期化します
	public function __construct($applicationAccessData, $container)
	{
		if ($applicationAccessData === null || $container === null)
			throw new Exception('some arguments are empty');

		$this->container = $container;
		$this->applicationAccessData = $applicationAccessData;
	}

	// データベースのレコードを作成し、インスタンスを取得します
	public static function createRecord($applicationId, $userId, $container)
	{
		if ($applicationId === null || $userId === null || $container === null)
			throw new Exception('some arguments are empty');

		$access = Model::factory('ApplicationAccessData')->create();
		$access->created_at = time();
		$access->user_id = $userId;
		$access->application_id = $applicationId;
		$access->save();

		return new ApplicationAccessModel($access, $container);
	}

	// アクセスキーを生成し、ハッシュを更新します
	public function generateKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->applicationAccessData->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		// キーコードが重複していたら3回まで施行
		$tryCount = 0;
		do
		{
			$tryCount++;
			$keyCode = rand(1, 99999);
			$isExist = Model::factory('ApplicationAccessData')->where('user_id', $this->applicationAccessData->user_id)->where('key_code', $keyCode)->count() !== 0;
		} while ($isExist && $tryCount < 3);

		if ($isExist && $tryCount >= 3)
			throw new \Utility\ApiException('the number of trials for key_code generation has reached its upper limit');

		$this->applicationAccessData->key_code = $keyCode;
		$this->applicationAccessData->save();

		$key = self::buildKey($this->applicationAccessData->application_id, $this->applicationAccessData->user_id, $keyCode, $this->container);

		return $key;
	}

	// キーを取得
	public function getKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && $this->applicationAccessData->creator_id !== $accessedUserId)
			throw new \Utility\ApiException('this key is managed by other user');

		if ($this->applicationAccessData->key_code === null)
			throw new \Utility\ApiException('key is empty');

		return self::buildKey($this->applicationAccessData->application_id, $this->applicationAccessData->user_id, $this->applicationAccessData->key_code, $container);
	}

	// ハッシュを構築
	public static function buildHash($applicationId, $userId, $keyCode, $container)
	{
		return strtoupper(hash('sha256', "{$container->config['access-key-base']}/{$applicationId}/{$userId}/{$keyCode}"));
	}

	// キーを構築
	public static function buildKey($applicationId, $userId, $keyCode, $container)
	{
		$hash = self::buildHash($applicationId, $userId, $keyCode, $container);
		return "{$userId}-{$hash}.{$keyCode}";
	}

	// キーを検証
	public static function verifyKey($accessKey, $container)
	{
		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $accessKey);

		if ($match === null)
			return false;

		$userId = $match[1];
		$hash = $match[2];
		$keyCode = $match[3];

		$access = Model::factory('ApplicationAccessData')->where('user_id', $userId)->where('key_code', $keyCode)->find_one();

		if (!$access)
			return false;

		$correctHash = self::buildHash($access->application_id, $userId, $keyCode, $container);
		$isPassed = $keyCode === $access->key_code && $hash === $correctHash;

		return $isPassed;
	}
}
