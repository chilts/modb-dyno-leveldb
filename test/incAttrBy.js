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

test('test incAttrBy()', function(t) {
    db.incAttrBy('chilts', 'logins', 1, ts(), function(err) {
        t.ok(!err, 'No error when incrementing an attribute');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, storedItem) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick : 'chilts',
            uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
            admin : false,
            logins : 28,
        };

        console.log(storedItem);

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (incAttrBy())');
        t.end();
    });
});


test('test incAttrBy()', function(t) {
    db.incAttrBy('other', 'logins', 1, ts(), function(err) {
        t.ok(!err, 'No error when incrementing an attribute on a new item');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('other', function(err, storedItem) {
        t.ok(!err, 'No error when getting the other item back');

        var newItem = {
            logins : 1
        };

        console.log(storedItem);

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (incAttrBy())');
        t.end();
    });
});

// ----------------------------------------------------------------------------