<?php

interface DatabaseAccess
{
	function findOneWithFilters($tableName, array $wheres);
	function findManyWithFilters($tableName, array $wheres);
	function create($tableName, array $dataArray);
	function find($tableName, $id);
}