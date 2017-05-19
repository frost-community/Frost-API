'use strict';

module.exports = (str) => {
	return (new Blob([str], {type: 'text/plain'})).size;
};
