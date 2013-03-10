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
    nick : 'delAttrs',
    uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
    admin : false,
    logins : 27,
};

test('test putItem()', function(t) {
    // put an item
    db.putItem('delAttrs', item, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test delAttrs()', function(t) {
    // get this item back
    db.delAttrs('delAttrs', [ 'admin', 'logins' ], ts(), function(err) {
        t.ok(!err, 'No error when deleting some attributes');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('delAttrs', function(err, storedItem) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick : 'delAttrs',
            uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
        };

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (delAttrs())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
