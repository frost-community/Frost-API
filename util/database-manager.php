<?php
namespace Utility;

class DatabaseManager
{
	public $database;

	/**
	 * DatabaseManager constructor for Connect Database
	 * @param string $hostName
	 * @param string $userName
	 * @param string $password
	 * @param string $dbName
	 * @throws \Exception BaseException
	 */
	public function __construct($hostName, $userName, $password, $dbName)
	{
		try
		{
			$this->database = new \PDO('mysql:dbname='.$dbName.';host='.$hostName, $userName, $password);
			$this->database->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
		}
		catch (\PDOException $e)
		{
			unset($this->database);
			throw new \Exception('failed to connect database.');
		}
		catch (\Exception $e){ /* NO CODE */}
	}

	public function execute($query, array $content)
	{
		$statement = $this->database->prepare($query);
		$statement->execute($content);

		return $statement;
	}

	public function executeFetch($query, array $content)
	{
		$result = self::execute($query, $content)->fetchAll();

		return $result;
	}
	
	public function transaction($callable)
	{
		try
		{
			$this->database->beginTransaction();
			//$callable = $callable->bindTo($this);
			$res = $callable();
			$this->database->commit();
		}
		catch(\Exception $e)
		{
			$dbh->rollBack();
			throw $e;
		}

		return $res;
	}
}

class Statement
{
	public $statement;
	
	public function __construct($statement)
	{
		$this->statement = $statement;
	}
	
	public function fetch()
	{
		return $this->statement->fetchAll();
	}
}
