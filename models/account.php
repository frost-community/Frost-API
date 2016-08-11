<?php

/**
 * ユーザーへのアクションを提供します
 */
class AccountModel
{
	private $userFactory;

	// 各種必要なFactory
	public function __construct(UserFactory $userFactory)
	{
		if ($userFactory === null)
			throw new \Exception('argument is empty');

		$this->userFactory = $userFactory;
	}

	public function create($screenName, $password, $name = null)
	{
		if ($screenName === null || $password === null)
			throw new \Utility\ApiException('required parameters are missing');

		if ($name === null)
			$name = 'froster';

		$userData = $this->userFactory->create($screenName, $password, $name);

		return $userData->toArrayResponse();
	}
}
