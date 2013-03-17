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

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', item, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test chilts()', function(t) {
    // get this item back
    db.delAttrs('chilts', [ 'admin', 'logins' ], ts(), function(err) {
        t.ok(!err, 'No error when deleting some attributes');
        t.end();
    });
});

test('test chilts()', function(t) {
    // get this item back
    db.putAttrs('chilts', { admin : true, logins : 0 }, ts(), function(err) {
        t.ok(!err, 'No error when adding some attributes');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, storedItem, meta) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick   : 'chilts',
            uuid   : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
            admin  : true,
            logins : 0,
        };

        t.equal(meta.changes, 3, 'The number of changes is 3');
        t.ok(meta.timestamp, 'The timestamp is a true(ish) value');
        t.ok(meta.hash, 'The hash is a true(ish) value');
        t.deepEqual(storedItem, newItem, 'Item is what we expect');

        // remember this timestamp
        var lastTimestamp = meta.timestamp;

        // now, let's flatten the item
        db.flatten('chilts', meta.hash, function(err) {

            // now, get the item back out
            db.getItem('chilts', function(err, storedItem, meta) {
                t.deepEqual(storedItem, newItem, "Item hasn't changed even after the .flatten()");
                t.equal(meta.timestamp, lastTimestamp, "LastTimestamp is still the same after the .flatten()");
                t.equal(meta.changes, 3, 'The number of changes is now 1, after the .flatten()');
                t.end();
            });
        });
    });
});

// ----------------------------------------------------------------------------
