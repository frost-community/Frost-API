<?php

/**
 * アプリケーションのレコードに対する操作を提供します
 */
class ApplicationData
{
	private $applicationFactory;
	public $record;

	public function __construct(ApplicationFactory $applicationFactory, $record)
	{
		if ($applicationFactory === null || $record === null)
			throw new \Exception('argument is empty');

		$this->applicationFactory = $applicationFactory;
		$this->record = $record;
	}

	/**
	 * 権限情報を配列としてデータベースから取得または値を設定します。引数にnullを与えると取得モードになります。
	 *
	 * @param array $value 設定する値
	 * @throws \Exception
	 * @return array 取得モード時は権限情報
	 */
	public function permissionsArray(array $value = null)
	{
		if ($value === null)
		{
			// get
			$permissionsArray = explode(',', $this->record->permissions);

			return $permissionsArray;
		}
		else
		{
			// set
			if (!is_array($value))
				throw new \Exception('argument type is invalid');

			$permissions = implode(',', $value);
			$this->record->permissions = $permissions;
		}
	}

	/**
	 * 指定された権限を所持しているかどうかを取得します
	 *
	 * @param string $permissionName 対象の権限
	 * @throws \Exception
	 * @return bool その権限を所持しているかどうか
	 */
	public function isHasPermission($permissionName)
	{
		if ($permissionName === null)
			throw new \Exception('argument is empty');

		return in_array($permissionName, $this->permissionsArray());
	}

	/**
	 * アプリケーションキーを生成します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function generateApplicationKey($accessedUserId = null)
	{
		if ($accessedUserId !== null)
		{
			// 自分のアプリケーションのキー以外は拒否
			if (intval($this->record->creator_id) !== intval($accessedUserId))
				throw new \Utility\ApiException('this key is managed by other user', [], 403);
		}

		$keyCode = random_int(1, 99999);
		$this->record->key_code = $keyCode;
		$this->record->save();

		return $this->applicationKey($accessedUserId);
	}

	/**
	 * アプリケーションキーを取得します
	 *
	 * @param int $accessedUserId アクセスされたユーザーのID(nullを許容します)
	 * @throws \Exception
	 * @throws \Utility\ApiException
	 * @return string アプリケーションキー
	 */
	public function applicationKey($accessedUserId = null)
	{
		if ($accessedUserId !== null)
		{
			// 自分のアプリケーションのキー以外は拒否
			if (intval($this->record->creator_id) !== intval($accessedUserId))
				throw new \Utility\ApiException('this key is managed by other user', [], 403);
		}

		if ($this->record->key_code === null)
			throw new \Utility\ApiException('key is empty', [], 404);

		return $this->applicationFactory->buildKey($this->record->id, $this->record->creator_id, $this->record->key_code);
	}

	/**
	 * レスポンス向けの配列データに変換します
	 *
	 * @return array レスポンス向けの配列データ
	 */
	public function toArrayResponse()
	{
		$data = [
			'id' => $this->record->id,
			'created_at' => $this->record->created_at,
			'creator_id' => $this->record->creator_id,
			'name' => $this->record->name,
			'description' => $this->record->description,
			'permissions' => $this->permissionsArray()
		];

		return $data;
	}
}
