<?php

/**
 * アプリケーションを作成、検索する手段を提供します
 */
class ApplicationModel
{
	private $database;
	private $config;
	private $regex;
	private $helper;

	/**
	 * 権限一覧
	 */
	public $permissionTypes = [
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

	public function __construct(DatabaseAccess $database, $config, \Utility\Regex $regex, ApplicationHelper $helper)
	{
		if ($database === null || $config === null || $regex === null || $helper === null)
			throw new \Exception('argument is empty');

		$this->database = $database;
		$this->config = $config;
		$this->regex = $regex;
		$this->helper = $helper;
	}

	/**
	 * 新しいレコードを作成してインスタンスを取得します
	 *
	 * @param int $userId ユーザーのID
	 * @param string $name 名前
	 * @param string $description 説明
	 * @param string $requestedPermissions 要求する権限
	 * @throws \Utility\ApiException
	 * @throws \Exception
	 * @return ApplicationModel 新しいインスタンス
	 */
	public function create($userId, $name, $description, $requestedPermissions)
	{
		if ($userId === null || $description === null || $requestedPermissions === null)
			throw new \Exception('argument is empty');

		if (!$this->regex->isMatch('/^[a-z,-]+$/', $requestedPermissions))
			throw new \Utility\ApiException('format of permissions parameter is invalid', ['detail'=>'it is required to be constructed in "a" to "z", and ","']);

		if ($this->database->findOneWithFilters($this->config['db']['table-names']['application'], ['name' => $name]))
			throw new \Utility\ApiException('already exists.', [], 409);

		$permissions = $this->helper->analyzePermissions(explode(',', $requestedPermissions));
		$record = $this->database->create($this->config['db']['table-names']['application'], [
			'created_at' => time(),
			'creator_id' => $userId,
			'name' => $name,
			'description' => $description,
			'permissions' => implode(',', $permissions)
		]);
		$record->save();

		return new ApplicationData($this->helper, $record);
	}

	/**
	 * 既存のレコードを取得してインスタンスを取得します
	 *
	 * @param int $applicationId アプリケーションID
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationData インスタンス
	 */
	public function find($applicationId)
	{
		if ($applicationId === null)
			throw new \Exception('argument is empty');

		$record = $this->database->find($this->config['db']['table-names']['application'], $applicationId);

		if (!$record)
			throw new \Utility\ApiException('application not found', [], 404);

		return new ApplicationData($this->helper, $record);
	}

	/**
	 * 条件によってレコードを検索してインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationData インスタンス
	 */
	public function findOneWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$record = $this->database->findOneWithFilters($this->config['db']['table-names']['application'], $wheres);

		if (!$record)
			throw new \Utility\ApiException('application not found', [], 404);

		return new ApplicationData($this->helper, $record);
	}

	/**
	 * 条件によってレコードを検索して複数のインスタンスを取得します
	 *
	 * @param array $wheres 条件の連想配列(where句)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return array ApplicationDataの配列
	 */
	public function findManyWithFilters(array $wheres)
	{
		if ($wheres === null)
			throw new \Exception('argument is empty');

		$records = $this->database->findManyWithFilters($this->config['db']['table-names']['application'], $wheres);

		if (count($records) === 0)
			throw new \Utility\ApiException('application not found', [], 404);

		foreach($records as $record)
			array_push($instances, new ApplicationData($this->helper, $record));

		return $instances;
	}
}
