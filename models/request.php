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
	 */
	public static function create($applicationId, $container)
	{
		// レコード構築・保存
		$req = Model::factory('RequestModel')->create();
		$req->container = $container;
		$req->created_at = time();
		$req->application_id = $applicationId;
		$req->save();

		return $req;
	}

	/**
	 * リクエストキーによってデータベースのレコードを検索し、インスタンスを取得します
	 *
	 * @param int $accessKey リクエストキー
	 * @param array $container コンテナー
	 * @throws \Exception
	 * @return RequestModel 新しいインスタンス
	 */
	public static function getByKey($requestKey, array $container)
	{
		if ($requestKey === null || $container === null)
			throw new \Exception('some arguments are empty');

		$parseResult = self::parseKeyToArray($requestKey);
		$request = Model::factory('RequestModel')->find_one(parseResult['id']);
		$request->container = $container;

		return $request;
	}

	/**
	 * アプリケーションを取得します
	 */
	public function application()
	{
		return $this->has_one('ApplicationModel', 'id');
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
	public static function buildHash($requestId, $applicationId, $keyCode, array $container)
	{
		return strtoupper(hash('sha256', "{$container->config['request-key-base']}/{$applicationId}/{$requestId}/{$keyCode}"));
	}

	/**
	 * 各種パラメータからキーを構築します
	 */
	public static function buildKey($requestId, $applicationId, $keyCode, array $container)
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

		$req = Model::factory('RequestModel')->find_one($parseResult['id']);

		if (!$req)
			return false;

		$correctHash = self::buildKey($parseResult['id'], $req->application_id, $parseResult['keyCode'], $container);
		$isAvailabilityPeriod = abs(time() - $app->created_at) < $container->config['request-key-expire-sec'];
		$isPassed = $isAvailabilityPeriod && $parseResult['hash'] === $correctHash && $parseResult['keyCode'];

		return $isPassed;
	}
}
