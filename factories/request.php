<?php

/**
 * 認証インスタンスのリクエストを作成、検索する手段を提供します
 */
class RequestFactory
{
	private $database;
	private $config;
	private $regex;

	public function __construct(DatabaseAccess $database, $config, \Utility\Regex $regex)
	{
		if ($database === null || $config === null || $regex === null)
			throw new \Exception('argument is empty');

		$this->database = $database;
		$this->config = $config;
		$this->regex = $regex;
	}

	/**
	 * 新しいレコードを作成してインスタンスを取得します
	 *
	 * @param int $applicationId アプリケーションID
	 * @return RequestData 新しいインスタンス
	 */
	public function create($applicationId)
	{
		if ($applicationId === null)
			throw new \Exception('argument is empty');

		$record = $this->database->create($this->config['db']['table-names']['request'], [
			'created_at' => time(),
			'application_id' => $applicationId
		]);
		$record->save();

		return $record;
	}

	/**
	 * 既存のレコードを取得してインスタンスを取得します
	 *
	 * @param int $requestId リクエストID
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return RequestData インスタンス
	 */
	public function find($requestId)
	{
		if ($requestId === null)
			throw new \Exception('argument is empty');

		$record = $this->database->find($this->config['db']['table-names']['request'], $requestId);

		if (!$record)
			throw new \Utility\ApiException('request not found', [], 404);

		return new RequestData($this, $record);
	}

	/**
	 * 条件によってレコードを検索してインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return RequestData インスタンス
	 */
	public function findOneWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$record = $this->database->findOneWithFilters($this->config['db']['table-names']['request'], $wheres);

		if (!$record)
			throw new \Utility\ApiException('application not found', [], 404);

		return new RequestData($this, $record);
	}

	/**
	 * 条件によってレコードを検索して複数のインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return array RequestDataの配列
	 */
	public function findManyWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$records = $this->database->findManyWithFilters($this->config['db']['table-names']['request'], $wheres);
		$instances = [];

		if (count($records) === 0)
			throw new \Utility\ApiException('application not found', [], 404);

		foreach($records as $record)
			array_push($instances, new RequestData($this, $record));

		return $instances;
	}

	/**
	 * 各種パラメータからキーを構築します
	 */
	private function buildKeyHash($requestId, $applicationId, $keyCode)
	{
		return strtoupper(hash('sha256', $this->config['request-key-base'].'/'.$applicationId.'/'.$requestId.'/'.$keyCode));
	}

	/**
	 * 各種パラメータからキーを構築します
	 */
	public function buildKey($requestId, $applicationId, $keyCode)
	{
		$hash = $this->buildKeyHash($requestId, $applicationId, $keyCode);
		$requestKey = $requestId.'-'.$hash.'.'.$keyCode;

		return $requestKey;
	}

	/**
	 * リクエストキーを配列に展開します
	 */
	public function parseKeyToArray($requestKey)
	{
		if ($requestKey === null)
			throw new \Exception('argument is empty');
		$match = $this->regex->match('/([^-]+)-([^-]{64}).([^-]+)/', $requestKey);

		if ($match === null)
			throw new \Utility\ApiException('key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * リクエストキーを検証します
	 * @param $requestKey
	 * @return bool
	 * @throws Exception
	 * @throws \Utility\ApiException
	 */
	public function verifyKey($requestKey)
	{
		if ($requestKey === null)
			throw new \Exception('argument is empty');

		try
		{
			$parseResult = $this->parseKeyToArray($requestKey);
		}
		catch(\Exception $e)
		{
			return false;
		}

		$requestData = $this->find($parseResult['id']);

		if (!$requestData)
			return false;

		$correctHash = $this->buildKey($parseResult['id'], $requestData->record->application_id, $parseResult['keyCode']);
		$isAvailabilityPeriod = abs(time() - $requestData->record->created_at) < $this->config['request-key-expire-sec'];
		$isPassed = $isAvailabilityPeriod && $parseResult['hash'] === $correctHash && $parseResult['keyCode'];

		return $isPassed;
	}
}
