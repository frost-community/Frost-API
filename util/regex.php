<?php
namespace Utility;

class Regex
{
	public function isMatch($regexStr, $content)
	{
		return preg_match($regexStr, $content) === 1;
	}
	
	public function match($regexStr, $content)
	{
		return preg_match($regexStr, $content, $ms) === 1 ? $ms : null;
	}
}
