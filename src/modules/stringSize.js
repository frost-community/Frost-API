module.exports = (str) => (new Blob([str], { type: 'text/plain' })).size;
