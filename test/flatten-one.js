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
};

var timestamp1 = '013d58c7276e-0000-188c-786ae2e1f629';

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', item, timestamp1, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test flatten()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, storedItem, meta) {
        t.ok(!err, 'No error when getting an item back');

        t.deepEqual(storedItem, item, 'Check the stored item is correct');

        db.flatten('chilts', meta.hash, function(err) {
            t.ok(!err, 'No error when flattening an item');
            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
