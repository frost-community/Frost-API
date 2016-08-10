<?php

/**
 * アプリケーションへのアクションを提供します
 */
class ApplicationModel
{
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

	private $applicationFactory;

	// 各種必要なFactory
	public function __construct(ApplicationFactory $applicationFactory)
	{
		if ($applicationFactory === null || $helper === null)
			throw new \Exception('argument is empty');

		$this->applicationFactory = $applicationFactory;
	}

	/**
	 * アプリケーションを作成します
	 * @param int $userId アプリケーションを作成するユーザーのID
	 * @param string $name 名称
	 * @param string $description 概要
	 * @param string $permissions 権限名をコンマで区切った文字列
	 */
	public function create($userId, $name, $description, $permissions)
	{
		if ($userId === null || $name === null || $description === null || $permissions === null)
			throw new \Exception('argument is empty');

		return $this->applicationFactory->create($userId, $name, $description, $permissions);
	}

	/**
	 * アプリケーションを取得します
	 * @param int $applicationId アプリケーションのID
	 */
	public function get($applicationId)
	{
		if ($applicationId === null)
			throw new \Exception('argument is empty');

		return $this->applicationFactory->find($applicationId);
	}

	public function keyGenerate($applicationId, $accessedUserId)
	{
		if ($applicationId === null || $accessedUserId === null)
			throw new \Exception('argument is empty');

		$applicationData = $this->applicationFactory->find($applicationId);
		$applicationData->generateApplicationKey($accessedUserId);
	}

	public function keyGet($applicationId, $accessedUserId)
	{
		if ($applicationId === null || $accessedUserId === null)
			throw new \Exception('argument is empty');

		$applicationData = $this->applicationFactory->find($applicationId);
		$applicationData->applicationKey($accessedUserId);
	}
}
