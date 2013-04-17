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
    nick : 'del',
    uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
    admin : false,
    logins : 27,
};

test('test putItem()', function(t) {
    // put an item
    db.putItem('del', ts(), item, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test del()', function(t) {
    // get this item back
    db.del('del', ts(), [ 'admin', 'logins' ], function(err) {
        t.ok(!err, 'No error when deleting some attributes');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('del', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            nick : 'del',
            uuid : 'f6deec09-c6c5-44eb-9c46-158bd35d0303',
        };

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (del())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
