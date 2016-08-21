'use strict';

exports = (db, collection) => {
	var instance = {_db: db, _collection: collection};

	instance.createDocument = (data) => new Promise((resolve, reject) => {
		_collection.insert(data,(err, document) => {
			if (err)
				return reject('faild to create document');

			resolve(document);
		});
	});

	instance.findDocument = () => {
	};

	return instance;
};
