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

test('test putAttrs()', function(t) {
    db.putAttrs('chilts', { email : 'me@example.com', logins : 28, admin : true }, ts(), function(err) {
        t.ok(!err, 'No error when putting some attributes');
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
            admin : true,
            logins : 28,
            email : 'me@example.com',
        };

        console.log(storedItem);

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (putAttrs())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
