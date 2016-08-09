<?php

/**
 * アプリケーションに関するヘルパーメソッドを提供します
 */
class ApplicationHelper
{
	private $applicationModel;
	private $config;
	private $regex;

	public function __construct(ApplicationModel $applicationModel, $config, \Utility\Regex $regex)
	{
		if ($applicationModel === null || $config === null || $regex === null)
			throw new \Exception('argument is empty');

		$this->applicationModel = $applicationModel;
		$this->config = $config;
		$this->regex = $regex;
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
		$app = $this->applicationModel->find($parseResult['id']);

		if (!$app)
			return false;

		$correctHash = $this->buildHash($parseResult['id'], $app->creator_id, $parseResult['keyCode']);
		$isPassed = $parseResult['keyCode'] === $app->key_code && $parseResult['hash'] === $correctHash;

		return $isPassed;
	}
}
