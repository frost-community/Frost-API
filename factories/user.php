<?php

/**
 * ユーザーを作成、検索する手段を提供します
 */
class UserFactory
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
	 * データベースのレコードを作成し、インスタンスを取得します
	 */
	public function create($screenName, $password, $name)
	{
		if ($screenName === null || $password === null || $name === null)
			throw new \Exception('argument is empty');

		$timestamp = time();

		$isOccurredError = false;
		$errorTargets = [];

		if (!$this->regex->isMatch('/^[a-z0-9_]{4,15}$/i', $screenName) || $this->regex->isMatch('/^(.)\1{3,}$/', $screenName))
		{
			$isOccurredError = true;
			$errorTargets[] = 'screen-name';
		}
		else
		{
			if ($this->findOneWithFilters(['screen_name' => $screenName])->record)
			{
				$isOccurredError = true;
				$errorTargets[] = 'screen-name';
			}
			else
			{
				foreach ($this->config['invalid-screen-names'] as $invalidScreenName)
				{
					if ($screenName === $invalidScreenName)
					{
						$isOccurredError = true;
						$errorTargets[] = 'screen-name';
					}
				}
			}
		}

		if (!$this->regex->isMatch('/^[a-z0-9_-]{6,128}$/i', $password))
		{
			$isOccurredError = true;
			$errorTargets[] = 'password';
		}

		if ($isOccurredError)
			throw new \Utility\ApiException('parameter is invalid', $errorTargets);

		$record = $this->database->create($this->config['db']['table-names']['user'], [
			'created_at' => $timestamp,
			'screen_name' => $screenName,
			'name' => $name,
			'password_hash' => hash('sha256', $password.$timestamp)
		]);

		return new UserData($this, $record);
	}

	/**
	 * 既存のレコードを取得してインスタンスを取得します
	 *
	 * @param int $applicationId アプリケーションID
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationData インスタンス
	 */
	public function find($requestId, $isThrowException = false)
	{
		if ($requestId === null)
			throw new \Exception('argument is empty');

		$record = $this->database->find($this->config['db']['table-names']['user'], $requestId);

		if ((!$record) && $isThrowException)
			throw new \Utility\ApiException('request not found', [], 404);

		return $record ? new UserData($this, $record) : null;
	}

	/**
	 * 条件によってレコードを検索してインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationData インスタンス
	 */
	public function findOneWithFilters(array $wheres, $isThrowException = false)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$record = $this->database->findOneWithFilters($this->config['db']['table-names']['user'], $wheres);

		if ((!$record) && $isThrowException)
			throw new \Utility\ApiException('request not found', [], 404);

		return $record ? new UserData($this, $record) : null;
	}

	/**
	 * 条件によってレコードを検索して複数のインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return array ApplicationDataの配列
	 */
	public function findManyWithFilters(array $wheres, $isThrowException = false)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$records = $this->database->findManyWithFilters($this->config['db']['table-names']['user'], $wheres);

		if ((count($records) === 0) && $isThrowException)
			throw new \Utility\ApiException('request not found', [], 404);

		foreach($records as $record)
			array_push($instances, new UserData($this, $record));

		return $instances;
	}
}
