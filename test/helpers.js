// ----------------------------------------------------------------------------
//
// helpers.js
//
// ----------------------------------------------------------------------------

var dyno = require('../dyno-leveldb.js');
function newDyno() {
    return dyno('/tmp/' + (new Date()).toISOString());
};

// ----------------------------------------------------------------------------

function pad(str, length) {
    str = '' + str;
    while ( str.length < length ) {
        str = '0' + str;
    }
    return str;
}

// first thing to do is make a simple timestamp function
var i = 0;
function timestamp() {
    i++;
    return (new Date()).toISOString() + '-' + pad(i, 8);
}

// make an even simpler timestamp function, return 0001, 0002, 0003, ...
function next() {
    i++;
    return pad(i, 4);
}

// ----------------------------------------------------------------------------

module.exports.timestamp = timestamp;
module.exports.next      = next;
module.exports.newDyno   = newDyno;

// ----------------------------------------------------------------------------
