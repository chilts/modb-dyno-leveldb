// use level-dyno and open a new datastore
var dyno = require('../level-dyno.js');
var flake = require('flake')('eth0');

// open a new database
var db = dyno('/tmp/users');

// do the above sequence
db.putItem('chilts', { nick : 'chilts', email : 'me@example.com' }, flake(), function(err) {
    console.log('putItem(): done');
});

db.incAttrBy('chilts', 'logins', 1, flake(), function(err) {
    console.log('incAttrBy(): done');
});

db.delAttrs('chilts', [ 'email' ], flake(), function(err) {
    console.log('delAttrs(): done');
});

db.putAttrs('chilts', { name : 'Andy Chilton' }, flake(), function(err) {
    console.log('putAttrs(): done');
});

db.putAttrs('chilts', { email : 'me@example.net' }, flake(), function(err) {
    console.log('putAttrs(): done');
});
