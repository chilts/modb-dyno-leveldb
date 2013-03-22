// use dyno-leveldb and open a new datastore
var dyno = require('../dyno-leveldb.js');
var flake = require('flake')('eth0');

// open a new database
var db = dyno('/tmp/users');

var user = 'chilts';

// do the above sequence
db.putItem(user, { nick : 'chilts', email : 'me@example.com' }, flake(), function(err) {
    console.log('putItem(): done');
});

db.incAttrBy(user, 'logins', 1, flake(), function(err) {
    console.log('incAttrBy(): done');
});

db.delAttrs(user, [ 'email' ], flake(), function(err) {
    console.log('delAttrs(): done');
});

db.putAttrs(user, { name : 'Andy Chilton' }, flake(), function(err) {
    console.log('putAttrs(): done');
});

db.putAttrs(user, { email : 'me@example.net' }, flake(), function(err) {
    console.log('putAttrs(): done');
});
