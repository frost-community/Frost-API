<?php

/**
 * フォロー情報を作成、検索する手段を提供します
 */
class UserFollowingFactory
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
	public function create($sourceUserId, $targetUserId)
	{
		if ($sourceUserId === null || $targetUserId === null)
			throw new \Exception('argument is empty');

		$timestamp = time();

		$record = $this->database->create($this->config['db']['table-names']['user-following'], [
			'created_at' => $timestamp,
			'source_user_id' => $sourceUserId,
			'target_user_id' => $targetUserId
		]);

		return new UserFollowingData($this, $record);
	}

	/**
	 * 既存のレコードを取得してインスタンスを取得します
	 *
	 * @param int $applicationId アプリケーションID
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationData インスタンス
	 */
	public function find($userFollowingId, $isThrowException = false)
	{
		if ($userFollowingId === null)
			throw new \Exception('argument is empty');

		$record = $this->database->find($this->config['db']['table-names']['user-following'], $userFollowingId);

		if ((!$record) && $isThrowException)
			throw new \Utility\ApiException('user following not found', [], 404);

		return new UserFollowingData($this, $record);
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

		$record = $this->database->findOneWithFilters($this->config['db']['table-names']['user-following'], $wheres);

		if ((!$record) && $isThrowException)
			throw new \Utility\ApiException('request not found', [], 404);

		return new UserFollowingData($this, $record);
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

		$records = $this->database->findManyWithFilters($this->config['db']['table-names']['user-following'], $wheres);

		if ((count($records) === 0) && $isThrowException)
			throw new \Utility\ApiException('request not found', [], 404);

		foreach($records as $record)
			array_push($instances, new UserFollowingData($this, $record));

		return $instances;
	}

	public function destroyOneWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$this->database->destroyOneWithFilters($this->config['db']['table-names']['user-following'], $wheres);
	}
}
