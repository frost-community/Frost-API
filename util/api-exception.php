<?php
namespace Utility;

class ApiException extends \Exception
{
	// 例外を再定義し、メッセージをオプションではなくする
	public function __construct($message, $data = [], Exception $previous = null)
	{
		parent::__construct($message, 0, $previous);
		$this->data = $data;
	}

	private $data;

	public function getData()
	{
		return $this->data;
	}
}
