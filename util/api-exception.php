<?php
namespace Utility;

class ApiException extends \Exception
{
	// 例外を再定義し、メッセージをオプションではなくする
	public function __construct($message, $data = [], $status = 400, \Exception $previous = null)
	{
		parent::__construct($message, 0, $previous);
		$this->data = $data;
		$this->status = $status;
	}

	private $data;
	private $status;

	public function getData()
	{
		return $this->data;
	}

	public function getStatus()
	{
		return $this->status;
	}
}
