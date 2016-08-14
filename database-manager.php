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

	public function findOneWithFilters($tableName, array $wheres)
	{
		$query = $this->getQueryWithFilters($tableName, $wheres);
		$record = $query->find_one();
		$recordArray = $record->as_array();

		$keys = array_keys($recordArray);
		for ($i = 0; $i < count($keys); $i++)
		{
			if (is_numeric($record[$keys[$i]]))
				$record[$keys[$i]] = intval($record[$keys[$i]]);
		}

		return $record;
	}

	public function findManyWithFilters($tableName, array $wheres)
	{
		$query = $this->getQueryWithFilters($tableName, $wheres);
		$records = $query->find_many();
		$recordsArray = $query->find_array();

		for ($i = 0; $i < count($recordsArray); $i++)
		{
			$keys = array_keys($recordsArray[$i]);

			for ($j = 0; $j < count($keys); $j++)
			{
				if (is_numeric($records[$i]->$keys[$j]))
					$records[$i]->$keys[$j] = intval($records[$i]->$keys[$j]);
			}
		}

		return $records;
	}

	function destroyOneWithFilters($tableName, array $wheres)
	{
		$record = findOneWithFilters($tableName, $wheres);

		if ($record)
			$record->delete();
	}
}
