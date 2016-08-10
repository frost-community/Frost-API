<?php

/**
 * アプリケーションを作成、検索する手段を提供します
 */
class ApplicationFactory
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
	 * @param int $userId ユーザーのID
	 * @param string $name 名前
	 * @param string $description 説明
	 * @param string $requestedPermissions 要求する権限
	 * @param array $permissionTypes 存在する権限名の配列
	 * @throws \Utility\ApiException
	 * @throws \Exception
	 * @return ApplicationModel 新しいインスタンス
	 */
	public function create($userId, $name, $description, $requestedPermissions, $permissionTypes)
	{
		if ($userId === null || $description === null || $requestedPermissions === null)
			throw new \Exception('argument is empty');

		if (!$this->regex->isMatch('/^[a-z,-]+$/', $requestedPermissions))
			throw new \Utility\ApiException('format of permissions parameter is invalid', ['detail'=>'it is required to be constructed in "a" to "z", and ","']);

		if ($this->database->findOneWithFilters($this->config['db']['table-names']['application'], ['name' => $name]))
			throw new \Utility\ApiException('already exists.', [], 409);

		$permissions = $this->analyzePermissions(explode(',', $requestedPermissions), $permissionTypes);
		$record = $this->database->create($this->config['db']['table-names']['application'], [
			'created_at' => time(),
			'creator_id' => $userId,
			'name' => $name,
			'description' => $description,
			'permissions' => implode(',', $permissions)
		]);
		$record->save();

		return new ApplicationData($this, $record);
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

		return new ApplicationData($this, $record);
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

		return new ApplicationData($this, $record);
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
			array_push($instances, new ApplicationData($this, $record));

		return $instances;
	}

	/**
	 * アプリケーションキーを構成するために必要なハッシュを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @throws \Exception
	 * @return string アプリケーションキーを構成するために必要なハッシュ
	 */
	private function buildKeyHash($id, $userId, $keyCode)
	{
		if ($id === null || $userId === null || $keyCode === null)
			throw new \Exception('argument is empty');

		return strtoupper(hash('sha256', $this->config['application-key-base'].'/'.$userId.'/'.$id.'/'.$keyCode));
	}

	/**
	 * アプリケーションキーを構築します
	 *
	 * @param int $id アプリケーションID
	 * @param int $userId ユーザーID
	 * @param int $keyCode キーの管理コード
	 * @throws \Exception
	 * @return string アプリケーションキー
	 */
	private function buildKey($id, $userId, $keyCode)
	{
		if ($id === null || $userId === null || $keyCode === null)
			throw new \Exception('argument is empty');

		$hash = $this->buildKeyHash($id, $userId, $keyCode, $container);
		$applicationKey = $id.'-'.$hash.'.'.$keyCode;

		return $applicationKey;
	}

	/**
	 * 権限の内容を解析して内容の正当性を確認します
	 *
	 * @param array $permissions 解析対象の権限の配列
	 * @param array $permissionTypes 存在する権限の配列
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return ApplicationModel 再構成された権限の配列
	 */
	public function analyzePermissions(array $permissions, array $permissionTypes)
	{
		if ($permissions === null)
			throw new \Exception('argument is empty');

		$isPermissionError = false;
		$invalidPermissionNames = [];

		foreach ($permissions as $permission)
		{
			$isFound = false;

			foreach ($permissionTypes as $permissionType)
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
	 * アプリケーションキーを配列に展開します
	 *
	 * @param string $applicationKey アプリケーションキー
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return array id,hash,keyCodeの格納された配列
	 */
	public function parseKeyToArray($applicationKey)
	{
		if ($applicationKey === null)
			throw new \Exception('argument is empty');

		$match = $this->regex->match('/([^-]+)-([^-]{64}).([^-]+)/', $applicationKey);

		if ($match === null)
			throw new \Utility\ApiException('application-key is invalid format');

		return [$match[1],$match[2],$match[3],'id'=>$match[1],'hash'=>$match[2],'keyCode'=>$match[3]];
	}

	/**
	 * アプリケーションキーを検証します
	 *
	 * @param string $applicationKey アプリケーションキー
	 * @throws \Exception
	 * @return bool キーが有効であるかどうか
	 */
	public function verifyKey($applicationKey)
	{
		if ($applicationKey === null)
			throw new \Exception('argument is empty');

		$parseResult = $this->parseKeyToArray($applicationKey);
		$appData = $this->find($parseResult['id']);

		if (!$appData)
			return false;

		$correctHash = $this->buildKeyHash($parseResult['id'], $appData->record->creator_id, $parseResult['keyCode']);
		$isPassed = $parseResult['keyCode'] === $appData->record->key_code && $parseResult['hash'] === $correctHash;

		return $isPassed;
	}
}
