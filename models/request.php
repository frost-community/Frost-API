<?php

/**
 * Webの認証ページのインスタンスを管理する
 */
class RequestModel extends Model
{
	public static $_table = 'frost_request';
	public static $_id_column = 'id';

	/**
	 * コンテナー
	 */
	private $container;

	/**
	 * データベースのレコードを作成し、インスタンスを取得します
	 * @param int $applicationId アプリケーションID
	 * @param object $container コンテナー
	 * @return RequestModel 新しいインスタンス
	 */
	public static function createInstance($applicationId, $container)
	{
		if ($applicationId === null || $container === null)
			throw new \Exception('some arguments are empty');

		// レコード構築・保存
		$req = self::create();
		$req->container = $container;
		$req->created_at = time();
		$req->application_id = $applicationId;
		$req->save();

		return $req;
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
	 * アプリケーションを取得します
	 */
	public function application()
	{
		return ApplicationModel::getInstance($this->application_id, $container);
	}

	/**
	 * PINコードを生成します
	 */
	public function generatePinCode()
	{
		// 数字6文字を生成
		foreach(range(0,6) as $i)
			$code .= random_int(0, 9);

		$this->pin_code = $code;
		$this->save();

		return $this->pin_code;
	}

	/**
	 * リクエストキーを生成し、ハッシュを更新します
	 */
	public function generateRequestKey()
	{
		$keyCode = random_int(1, 99999);
		$this->key_code = $keyCode;
		$this->save();

		return $this->requestKey();
	}

	/**
	 * リクエストキーをデータベースから取得します
	 */
	public function requestKey()
	{
		return self::buildKey($this->id, $this->application_id, $this->key_code, $this->container);
	}

	/**
	 * 各種パラメータからキーを構築します
	 */
	public static function buildHash($requestId, $applicationId, $keyCode, $container)
	{
		return strtoupper(hash('sha256', "{$container->config['request-key-base']}/{$applicationId}/{$requestId}/{$keyCode}"));
	}

	/**
	 * 各種パラメータからキーを構築します
	 */
	public static function buildKey($requestId, $applicationId, $keyCode, $container)
	{
		$hash = self::buildHash($requestId, $applicationId, $keyCode, $container);

		return "{$requestId}-{$hash}.{$keyCode}";
	}

	/**
	 * リクエストキーを配列に展開します
	 */
	public static function parseKeyToArray($requestKey)
	{
		if ($requestKey === null)
			throw new \Exception('some arguments are empty');

		$match = \Utility\Regex::match('/([^-]+)-([^-]{64}).([^-]+)/', $requestKey);

		if ($match === null)
			throw new \Utility\ApiException('key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * リクエストキーを検証します
	 */
	public static function verifyKey($requestKey, $container)
	{
		try
		{
			$parseResult = self::parseKeyToArray($requestKey);
		}
		catch(\Exception $e)
		{
			return false;
		}

		$req = self::getInstance($parseResult['id'], $container);

		if (!$req)
			return false;

		$correctHash = self::buildKey($parseResult['id'], $req->application_id, $parseResult['keyCode'], $container);
		$isAvailabilityPeriod = abs(time() - $app->created_at) < $container->config['request-key-expire-sec'];
		$isPassed = $isAvailabilityPeriod && $parseResult['hash'] === $correctHash && $parseResult['keyCode'];

		return $isPassed;
	}
}
