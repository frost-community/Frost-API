'use strict';

module.exports = (obj) => Object.prototype.toString.call(obj).slice(8, -1);
