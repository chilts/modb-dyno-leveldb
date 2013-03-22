// use dyno-leveldb and open a new datastore
var dyno = require('../dyno-leveldb.js');
var flake = require('flake')('eth0');

// open a new database
var db = dyno('/tmp/users');

// now, flatten it
db.delAttrs('chilts', ['name'], flake(), function(err) {
    console.log('Name has been removed');
});
