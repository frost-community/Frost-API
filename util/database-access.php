<?php

interface DatabaseAccess
{
	function create($tableName, array $dataArray);
	function find($tableName, $id);
	function findOneWithFilters($tableName, array $wheres);
	function findManyWithFilters($tableName, array $wheres);
	function destroyOneWithFilters($tableName, array $wheres);
}
