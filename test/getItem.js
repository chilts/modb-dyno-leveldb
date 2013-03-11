// ----------------------------------------------------------------------------

var underscore = require('underscore');
var tap = require('tap');

var helpers = require('./helpers.js');

var plan = tap.plan;
var test = tap.test;

// ----------------------------------------------------------------------------

var db = helpers.newDyno();
var ts = helpers.timestamp;

// ----------------------------------------------------------------------------

var item = {
    nick : 'chilts',
    uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
    admin : false,
    logins : 27,
};

test('test putItem', function(t) {
    // put an item
    db.putItem('chilts', item, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test getItem', function(t) {
    // get this item back
    db.getItem('chilts', function(err, retrievedItem, meta) {
        t.ok(!err, 'No error when getting an item back');
        t.deepEqual(retrievedItem, item, 'The item and the one stored are the same');
        t.ok(meta.timestamp, 'Timestamp is there and is true(ish)');
        t.equal(meta.changes, 1, 'So far, there has only been one change');
        t.similar(meta.hash, /^[a-f0-9]{32}$/, 'hash looks like an MD5 hash');
        t.end();
    });
});

test('test getItem (no item found)', function(t) {
    // get this item back
    db.getItem('pie', function(err, item) {
        console.log(item);
        t.ok(!err, 'No error when getting an item back');
        t.equal(item, undefined, 'Item is undefined');
        t.end();
    });
});

// ----------------------------------------------------------------------------
