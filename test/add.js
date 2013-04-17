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
    lives : 10,
};

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', ts(), item, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test incBy()', function(t) {
    db.incBy('chilts', ts(), 'logins', 1, function(err) {
        t.ok(!err, 'No error when incrementing an attribute');
        db.decBy('chilts', ts(), 'lives', 1, function(err) {
            t.ok(!err, 'No error when decrementing an attribute');
            t.end();
        });
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick : 'chilts',
            uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
            admin : false,
            logins : 28,
            lives : 9,
        };

        console.log(changeset);

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (incBy())');
        t.end();
    });
});

test('test inc()/dec()', function(t) {
    db.inc('chilts', ts(), 'logins', function(err) {
        t.ok(!err, 'No error when incrementing an attribute');
        db.dec('chilts', ts(), 'lives', function(err) {
            t.ok(!err, 'No error when decrementing an attribute');
            t.end();
        });
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick : 'chilts',
            uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
            admin : false,
            logins : 29,
            lives : 8,
        };

        console.log(changeset);

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (incBy())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// test incrementing on a non-existing item

test('test incBy()', function(t) {
    db.incBy('other', ts(), 'logins', 1, function(err) {
        t.ok(!err, 'No error when incrementing an attribute on a new item');
        db.decBy('other', ts(), 'lives', 1, function(err) {
            t.ok(!err, 'No error when decrementing an attribute on a new item');
            t.end();
        });
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('other', function(err, changeset) {
        t.ok(!err, 'No error when getting the other item back');

        var newItem = {
            logins : 1,
            lives : -1,
        };

        console.log(changeset);

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (incBy())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
