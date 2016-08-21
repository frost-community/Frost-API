'use strict';

exports = (db) => {
	var instance = {_db: db};

	instance.createCollection = (name, parameters) => new Promise((resolve, reject) => {
		instance._db.createCollection(name, parameters, (err, collection) => {
			if (err)
				return reject('faild to create collection');

			resolve(require('./collection')(_db, collection));
		});
	});

	instance.findCollection = (name) => {
	};

	return instance;
};
