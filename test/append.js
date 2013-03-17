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

var itemName = 'item';
var item = {
    something : 'here',
};

test('test putItem()', function(t) {
    // put an item
    db.putItem(itemName, item, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test append()', function(t) {
    db.append(itemName, 'something', ':more', ts(), function(err) {
        t.ok(!err, 'No error when appending an attribute');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem(itemName, function(err, storedItem) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            something : 'here:more',
        };

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (append())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// the empty case

test('test append() to an empty attribute', function(t) {
    db.append('other', 'something', 'here', ts(), function(err) {
        t.ok(!err, 'No error when incrementing an attribute on a new item');

        // get this item back
        db.getItem('other', function(err, storedItem) {
            t.ok(!err, 'No error when getting the other item back');

            var newItem = {
                something : 'here',
            };

            t.deepEqual(storedItem, newItem, 'Item has been modified ok (append() on empty)');
            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
