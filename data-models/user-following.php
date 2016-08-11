<?php

/**
 * フォロー情報レコードに対する操作を提供します
 */
class UserFollowingData
{
	private $userFollowingFactory;
	public $record;

	public function __construct(UserFollowingFactory $userFollowingFactory, $record)
	{
		if ($userFollowingFactory === null || $record === null)
			throw new \Exception('argument is empty');

		$this->userFollowingFactory = $userFollowingFactory;
		$this->record = $record;
	}

	/**
	 * フォロー元(した側)のユーザーを取得します
	 */
	public function sourceUser(UserFactory $userFactory)
	{
		return $userFactory->find($this->record->source_user_id);
	}

	/**
	 * フォロー先(された側)のユーザーを取得します
	 */
	public function targetUser(UserFactory $userFactory)
	{
		return $userFactory->find($this->record->target_user_id);
	}
}
