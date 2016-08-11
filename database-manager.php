<?php

class DatabaseManager implements DatabaseAccess
{
	private function getQueryWithFilters($tableName, array $wheres)
	{
		if ($tableName === null || $wheres === null)
			throw new \Exception('argument is empty');

		$query = ORM::for_table($tableName);

		foreach($wheres as $key => $value)
			$query = $query->where($key, $value);

		return $query;
	}

	public function findOneWithFilters($tableName, array $wheres)
	{
		$query = $this->getQueryWithFilters($tableName, $wheres);
		$record = $query->find_one();

		if (!$record)
			throw new \Utility\ApiException('not found', [], 404);

		return $record;
	}

	public function findManyWithFilters($tableName, array $wheres)
	{
		$query = $this->getQueryWithFilters($tableName, $wheres);
		$records = $query->find_many();

		if (count($record) == 0)
			throw new \Utility\ApiException('not found', [], 404);

		return $records;
	}

	public function create($tableName, array $dataArray)
	{
		if ($tableName === null || $dataArray === null)
			throw new \Exception('argument is empty');

		$record = ORM::for_table($tableName)->create();

		foreach($dataArray as $key => $value)
			$record->$key = $value;

		$record->save();

		return $record;
	}

	public function find($tableName, $id)
	{
		return $this->findOneWithFilters($tableName, ['id'=>$id]);
	}
}
