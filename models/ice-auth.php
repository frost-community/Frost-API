<?php

/**
 * アプリケーションによるAPIアクセスのインスタンスを管理します
 */
class IceAuthModel
{
	private $requestFactory;
	private $applicationFactory;
	private $applicationAccessFactory;

	public function __construct(RequestFactory $requestFactory, ApplicationFactory $applicationFactory, ApplicationAccessFactory $applicationAccessFactory)
	{
		if ($requestFactory === null || $applicationFactory === null || $applicationAccessFactory === null)
			throw new \Exception('argument is empty');

		$this->requestFactory = $requestFactory;
		$this->applicationFactory = $applicationFactory;
		$this->applicationAccessFactory = $applicationAccessFactory;
	}

	public function createRequest($applicationKey)
	{
		if ($applicationKey === null)
			throw new \Exception('argument is empty');

		if (!$this->applicationFactory->verifyKey($applicationKey))
			throw new \Utility\ApiException('parameter is invalid', ['application-key']);

		$applicationId = $applicationFactory->parseKeyToArray($applicationKey)['id'];
		$requestData = $this->requestFactory->create($applicationId);
		$requestData->generatePinCode();
		$requestKey = $requestData->generateRequestKey();
		
		return $requestKey;
	}

	public function getPinCode($requestKey)
	{
		if ($requestKey === null)
			throw new \Exception('argument is empty');

		if (!$requestFactory->verifyKey($requestKey))
			throw new \Utility\ApiException('parameter is invalid', ['request-key']);

		$keyElements = $requestFactory->parseKeyToArray($requestKey);
		$requestData = $requestFactory->findOneWithFilters(['id' => $keyElements['id'], 'key_code' => $keyElements['keyCode']]);
		$pinCode = $requestData->record->pin_code;

		if (!$pinCode)
			throw new \Utility\ApiException('pin-code is empty', ['request-key']);

		return $pinCode;
	}

	public function authorize($requestKey, $userId, $pinCode)
	{
		if ($requestKey === null || $userId === null || $pinCode === null)
			throw new \Exception('argument is empty');

		if (!$requestFactory->verifyKey($requestKey))
			throw new \Utility\ApiException('parameter is invalid', ['request-key']);

		$keyElements = $requestFactory->parseKeyToArray($requestKey);
		$requestData = $requestFactory->findOneWithFilters(['id' => $keyElements['id'], 'key_code' => $keyElements['keyCode']]);

		if ($requestData->record->pin_code !== $pinCode)
			throw new \Utility\ApiException('parameter is invalid', ['pin-code']);

		$applicationData = $requestData->application();
		$accessData = $applicationAccessFactory->findOneWithFilters(['user_id' => $userId, 'application_id' => $applicationData->record->id]);

		if (!$accessData)
		{
			$accessData = $applicationAccessFactory->create($applicationData->record->id, $userId);
			$accessData->generateAccessKey($userId);
		}

		$accessKey = $accessData->accessKey($userId);

		return $accessKey;
	}
}
