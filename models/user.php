<?php

/**
 * ユーザーへのアクションを提供します
 */
class UserModel
{
	private $userFactory;

	// 各種必要なFactory
	public function __construct(UserFactory $userFactory)
	{
		if ($userFactory === null)
			throw new \Exception('argument is empty');

		$this->userFactory = $userFactory;
	}

	public function get($userId)
	{
		if ($userId === null)
			throw new \Utility\ApiException('required parameters are missing');

		return $this->userFactory->find($userId)->toArrayResponse();
	}
}
