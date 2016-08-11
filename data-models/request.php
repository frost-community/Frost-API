<?php

/**
 * 認証インスタンスのリクエストのレコードに対する操作を提供します
 */
class RequestData
{
	private $requestFactory;
	public $record;

	public function __construct(RequestFactory $requestFactory, $record)
	{
		if ($requestFactory === null || $record === null)
			throw new \Exception('argument is empty');

		$this->requestFactory = $requestFactory;
		$this->record = $record;
	}

	/**
	 * アプリケーションを取得します
	 * @param ApplicationFactory $applicationFactory
	 * @return ApplicationData
	 * @throws Exception
	 * @throws \Utility\ApiException
	 */
	public function application(ApplicationFactory $applicationFactory)
	{
		return $applicationFactory->find($this->record->application_id);
	}

	/**
	 * PINコードを生成します
	 */
	public function generatePinCode()
	{
		// 数字6文字を生成
		foreach(range(0,6) as $i)
			$code .= random_int(0, 9);

		$this->record->pin_code = $code;
		$this->record->save();

		return $this->record->pin_code;
	}

	/**
	 * リクエストキーを生成し、ハッシュを更新します
	 */
	public function generateRequestKey()
	{
		$keyCode = random_int(1, 99999);
		$this->record->key_code = $keyCode;
		$this->record->save();

		return $this->requestKey();
	}

	/**
	 * リクエストキーをデータベースから取得します
	 */
	public function requestKey()
	{
		return $this->requestFactory->buildKey($this->record->id, $this->record->application_id, $this->record->key_code);
	}
}
