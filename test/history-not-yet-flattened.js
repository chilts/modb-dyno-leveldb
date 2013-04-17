// ----------------------------------------------------------------------------

var underscore = require('underscore');
var tap = require('tap');

var helpers = require('./helpers.js');

var plan = tap.plan;
var test = tap.test;

// ----------------------------------------------------------------------------

var db = helpers.newDyno();
var ts = helpers.timestamp;
var next = helpers.next;

// ----------------------------------------------------------------------------

var item = {
    nick : 'chilts',
    uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
    admin : false,
    logins : 27,
};

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', next(), item, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test chilts()', function(t) {
    // get this item back
    db.del('chilts', next(), [ 'admin', 'logins' ], function(err) {
        t.ok(!err, 'No error when deleting some attributes');
        t.end();
    });
});

test('test chilts()', function(t) {
    // get this item back
    db.put('chilts', next(), { admin : true, logins : 0 }, function(err) {
        t.ok(!err, 'No error when adding some attributes');
        t.end();
    });
});

test('test getChangesets()', function(t) {
    db.getHistory('chilts', function(err, changesets) {
        t.equal(changesets.length, 3, 'The number of changesets is 3');
        t.equal(changesets[0].operation, 'putItem', 'First op is a putItem');
        t.equal(changesets[1].operation, 'del', 'Second op is a del');
        t.equal(changesets[2].operation, 'put', 'Third op is a put');
        t.equal(changesets[0].timestamp, '0001', 'ts=0001');
        t.equal(changesets[1].timestamp, '0002', 'ts=0002');
        t.equal(changesets[2].timestamp, '0003', 'ts=0003');
        changesets.forEach(function(v, i) {
            t.equal(changesets[2].name, 'chilts', 'name is chilts for index = ' + i);
        });
        t.deepEqual(changesets[0].change, { nick : 'chilts', admin : false, logins : 27, uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303' }, 'change for 0 is ok');
        t.deepEqual(changesets[1].change, ['admin', 'logins'], 'change for 1 is ok');
        t.deepEqual(changesets[2].change, { 'admin' : true, 'logins' : 0 }, 'change for 2 is ok');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick   : 'chilts',
            uuid   : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
            admin  : true,
            logins : 0,
        };

        t.equal(changeset.changes, 3, 'The number of changes is 3');
        t.ok(changeset.timestamp, 'The timestamp is a true(ish) value');
        t.ok(changeset.hash, 'The hash is a true(ish) value');
        t.deepEqual(changeset.value, newItem, 'Item is what we expect');

        // remember this timestamp
        var lastTimestamp = changeset.timestamp;

        // now, let's flatten the item
        db.flatten('chilts', changeset.hash, function(err) {

            // now, get the item back out
            db.getItem('chilts', function(err, changeset) {
                t.deepEqual(changeset.value, newItem, "Item hasn't changed even after the .flatten()");
                t.equal(changeset.timestamp, lastTimestamp, "LastTimestamp is still the same after the .flatten()");
                t.equal(changeset.changes, 3, 'The number of changes is now 1, after the .flatten()');
                t.end();
            });
        });
    });
});

// ----------------------------------------------------------------------------
