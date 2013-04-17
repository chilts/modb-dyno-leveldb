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
// the empty item case

var itemName1 = 'item1';
var itemName2 = 'item2';

test('test putItem()', function(t) {
    // put an item
    db.putItem(itemName1, ts(), {}, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test addToSet()', function(t) {
    db.addToSet(itemName1, ts(), 'set', 'red', function(err) {
        t.ok(!err, 'No error when adding a value to a set');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem(itemName1, function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            set : { 'red' : true },
        };

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (addToSet())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// the attr containing something already

test('test putItem()', function(t) {
    // put an item
    db.putItem(itemName2, ts(), { set : 'red' }, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test addToSet()', function(t) {
    db.addToSet(itemName2, ts(), 'set', 'blue', function(err) {
        t.ok(!err, 'No error when adding a value to a set');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem(itemName2, function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            set : { red : true, blue : true },
        };

        t.deepEqual(changeset.value, newItem, 'Item has been modified ok (addToSet() to now have two items in the set)');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// the empty case

test('test addToSet() to an empty attribute', function(t) {
    db.addToSet('other', ts(), 'set', 'red', function(err) {
        t.ok(!err, 'No error when incrementing an attribute on a new item');

        // get this item back
        db.getItem('other', function(err, changeset) {
            t.ok(!err, 'No error when getting the other item back');

            var newItem = {
                set : { 'red' : true },
            };

            t.deepEqual(changeset.value, newItem, 'Item has been modified ok (addToSet() on empty)');
            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
