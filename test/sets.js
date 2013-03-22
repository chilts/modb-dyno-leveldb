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
    db.putItem(itemName1, {}, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test addToAttrSet()', function(t) {
    db.addToAttrSet(itemName1, 'set', 'red', ts(), function(err) {
        t.ok(!err, 'No error when adding a value to a set');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem(itemName1, function(err, storedItem) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            set : { 'red' : true },
        };

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (addToAttrSet())');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// the attr containing something already

test('test putItem()', function(t) {
    // put an item
    db.putItem(itemName2, { set : 'red' }, ts(), function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test addToAttrSet()', function(t) {
    db.addToAttrSet(itemName2, 'set', 'blue', ts(), function(err) {
        t.ok(!err, 'No error when adding a value to a set');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem(itemName2, function(err, storedItem) {
        t.ok(!err, 'No error when getting an item back');

        var newItem = {
            set : { red : true, blue : true },
        };

        t.deepEqual(storedItem, newItem, 'Item has been modified ok (addToAttrSet() to now have two items in the set)');
        t.end();
    });
});

// ----------------------------------------------------------------------------
// the empty case

test('test addToAttrSet() to an empty attribute', function(t) {
    db.addToAttrSet('other', 'set', 'red', ts(), function(err) {
        t.ok(!err, 'No error when incrementing an attribute on a new item');

        // get this item back
        db.getItem('other', function(err, storedItem) {
            t.ok(!err, 'No error when getting the other item back');

            var newItem = {
                set : { 'red' : true },
            };

            t.deepEqual(storedItem, newItem, 'Item has been modified ok (addToAttrSet() on empty)');
            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
