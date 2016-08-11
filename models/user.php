<?php

/**
 * ユーザーへのアクションを提供します
 */
class UserModel
{
	private $userFactory;
	private $userFollowingFactory;

	// 各種必要なFactory
	public function __construct(UserFactory $userFactory, UserFollowingFactory $userFollowingFactory)
	{
		if ($userFactory === null)
			throw new \Exception('argument is empty');

		$this->userFactory = $userFactory;
		$this->userFollowingFactory = $userFollowingFactory;
	}

	public function get($userId)
	{
		if ($userId === null)
			throw new \Utility\ApiException('required parameters are missing');

		if (!$this->userFactory->find($userId)->record)
			throw new \Utility\ApiException('user not found', [], 404);

		return $this->userFactory->find($userId)->toArrayResponse();
	}

	public function follow($sourceUserId, $targetUserId)
	{
		if ($sourceUserId === null || $targetUserId === null)
			throw new \Utility\ApiException('required parameters are missing');

		if (!$this->userFactory->find($targetUserId)->record)
			throw new \Utility\ApiException('user not found', [], 404);

		if ($targetUserId === $sourceUserId)
			throw new \Utility\ApiException('target user is you');

		$userFollowingData = $this->userFollowingFactory->findOneWithFilters(['source_user_id' => $sourceUserId, 'target_user_id' => $targetUserId]);

		if ($userFollowingData->record)
			throw new \Utility\ApiException('already follow');

		$this->userFollowingFactory->create($sourceUserId, $targetUserId);
	}

	public function unfollow($sourceUserId, $targetUserId)
	{
		if ($sourceUserId === null || $targetUserId === null)
			throw new \Utility\ApiException('required parameters are missing');

		if (!$this->userFactory->find($targetUserId)->record)
			throw new \Utility\ApiException('user not found', [], 404);

		$userFollowingData = $this->userFollowingFactory->findOneWithFilters(['source_user_id' => $sourceUserId, 'target_user_id' => $targetUserId]);

		if (!$userFollowingData->record)
			throw new \Utility\ApiException('user following not found');

		$userFollowingData->record->delete();
	}
}
