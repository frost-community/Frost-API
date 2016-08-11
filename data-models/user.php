<?php

/**
 * ユーザーのレコードに対する操作を提供します
 */
class UserData
{
	private $userFactory;
	public $record;

	public function __construct(UserFactory $userFactory, $record)
	{
		if ($userFactory === null || $record === null)
			throw new \Exception('argument is empty');

		$this->userFactory = $userFactory;
		$this->record = $record;
	}

	/**
	 * アプリケーションを取得します
	 */
	public function applications(ApplicationFactory $applicationFactory)
	{
		return $applicationFactory->findManyWithFilters(['user_id', $this->record->id]);
	}

	/**
	 * アプリケーションアクセスを取得します
	 */
	public function applicationAccesses(ApplicationAccessFactory $applicationAccessFactory)
	{
		return $applicationAccessFactory->findManyWithFilters(['user_id', $this->record->id]);
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
			'screen_name' => $this->record->screen_name,
			'name' => $this->record->name
		];

		return $data;
	}
}
