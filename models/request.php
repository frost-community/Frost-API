<?php
namespace Models;

// Webの認証ページの有効期限を管理する
class Request
{
	public static function create($applicationKey, $container)
	{
		$num = random_int(1, 99999);
		$timestamp = time();
		$key = $timestamp.'-'.strtoupper(hash('sha256', $container->config['request-key-base'].$applicationKey.$timestamp.$num));

		try
		{
			$requestTable = $container->config['db']['table-names']['request'];
			$container->dbManager->execute("insert into $requestTable (created_at, application_key, key) values(?, ?, ?)", [$timestamp, $applicationKey, $key]);
		}
		catch(\PDOException $e)
		{
			throw new \Utility\ApiException('faild to create database record', ['request-key']);
		}

		$request = fetchByKey($key, $container);

		return $request;
	}

	public static function fetchByKey($requestKey, $container)
	{
		try
		{
			$requestTable = $container->config['db']['table-names']['request'];
			$requests = $container->dbManager->executeFetch("select * from $requestTable where key = ?", [$requestKey]);
		}
		catch(\PDOException $e)
		{
			throw new \Utility\ApiException('faild to fetch request');
		}

		if (count($requests) === 0)
			throw new \Utility\ApiException('request not found');

		return $requests[0];
	}

	public static function validate($requestKey, $container)
	{
		try
		{
			$request = self::fetchByKey($requestKey, $container);
		}
		catch(\Exception $e)
		{
			return false;
		}

		return abs(time() - $request['created_at']) < $container->config['request-key-expire-sec'];
	}

	public static function destroy($requestKey, $container)
	{
		try
		{
			$requestTable = $container->config['db']['table-names']['request'];
			$container->dbManager->execute("delete from $requestTable where key = ?", [$requestKey]);
		}
		catch(\PDOException $e)
		{
			throw new \Utility\ApiException('faild to destroy database record');
		}

		return true;
	}
}
