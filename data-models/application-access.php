<?php

/**
 * アプリケーションアクセスのレコードに対する操作を提供します
 */
class ApplicationAccessData
{
	private $applicationAccessFactory;
	public $record;

	public function __construct(ApplicationAccessFactory $applicationAccessFactory, $record)
	{
		if ($applicationAccessFactory === null || $record === null)
			throw new \Exception('argument is empty');

		$this->applicationAccessFactory = $applicationAccessFactory;
		$this->record = $record;
	}

	/**
	 * このインスタンスに紐付いているアプリケーションを取得します
	 */
	public function application(ApplicationFactory $applicationFactory)
	{
		return $applicationFactory->find($this->record->application_id);
	}

	/**
	 * このインスタンスに紐付いているユーザーを取得します
	 */
	public function user(UserFactory $userFactory)
	{
		return $userFactory->find($this->user_id);
	}

	/**
	 * アクセスキーを生成しハッシュを更新します
	 */
	public function generateAccessKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && intval($this->creator_id) !== intval($accessedUserId))
			throw new \Utility\ApiException('this key is managed by other user', [], 403);

		// キーコードが重複していたら3回まで施行
		$tryCount = 0;
		do
		{
			$tryCount++;
			$keyCode = random_int(1, 99999);
			$isExist = $this->applicationAccessFactory->findOneWithFilters(['user_id' => $this->record->user_id, 'key_code' => $keyCode]);
		} while ($isExist && $tryCount < 3);

		if ($isExist && $tryCount >= 3)
			throw new \Utility\ApiException('the number of trials for key_code generation has reached its upper limit', 500);

		$this->record->key_code = $keyCode;
		$this->record->save();

		return $this->accessKey($accessedUserId);
	}

	/**
	 * アクセスキーを取得します
	 */
	public function accessKey($accessedUserId = null)
	{
		// 自分のアプリケーションのキー以外は拒否
		if ($accessedUserId !== null && intval($this->record->creator_id) !== intval($accessedUserId))
			throw new \Utility\ApiException('this key is managed by other user', [], 403);

		if ($this->record->key_code === null)
			throw new \Utility\ApiException('key is empty', [], 404);

		return $this->applicationAccessFactory->buildKey($this->record->application_id, $this->record->user_id, $this->record->key_code);
	}
}
