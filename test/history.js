// ----------------------------------------------------------------------------

var crypto = require('crypto');

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

// use our own timestamp
var timestamp1 = '013d58c7276e-0000-188c-786ae2e1f629';
var timestamp2 = '013d58c7276f-0002-188c-786ae2e1f629';
var hash1 = '452f1689473f291c56a4c97b49ae2424';
var hash2 = 'bd7cfce169eb5a39dd2a427bb52535c8';

test('test putItem()', function(t) {
    // put an item, but use our own timestamp
    db.putItem('chilts', item, timestamp1, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, storedItem, meta) {
        t.ok(!err, 'No error when getting an item back');

        t.equal(meta.changesets, 1, 'The number of changes is 1');
        t.ok(meta.timestamp, 'The timestamp is a true(ish) value');
        t.equal(meta.timestamp, timestamp1, 'The timestamp is what we expect');
        t.ok(meta.hash, 'The hash is a true(ish) value');
        t.equal(meta.hash, hash1, 'The hash is equal to what we expect');
        t.deepEqual(storedItem, item, 'Item is what we expect');

        // test that we know what the hash is of
        var hashThis = 'chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem{"nick":"chilts"}';
        var hash = crypto.createHash('md5').update(hashThis).digest('hex');
        t.equal(meta.hash, hash, 'The caluculated hash and the one we expect are the same');

        t.end();
    });
});

test('test putAttrs()', function(t) {
    // add some more attrs, then get it back out again
    db.putAttrs('chilts', { 'admin' : true }, timestamp2, function(err, storedItem, meta) {
        t.ok(!err, 'No error when putting some attributes');

        // get this item back
        db.getItem('chilts', function(err, storedItem, meta) {
            t.ok(!err, 'No error when getting an item back');

            var currentItem = {
                nick  : 'chilts',
                admin : true,
            };

            t.equal(meta.changesets, 2, 'The number of changes is 2');
            t.ok(meta.timestamp, 'The timestamp is a true(ish) value');
            t.equal(meta.timestamp, timestamp2, 'The timestamp is what we expect');
            t.ok(meta.hash, 'The hash is a true(ish) value');
            t.equal(meta.hash, hash2, 'The hash is a true(ish) value');
            t.deepEqual(storedItem, currentItem, 'Item is what we expect');

            // test that we know what the hash is of (the hash of the last changeset, plus this one)
            var hashThis = hash1 + "\n";
            hashThis += 'chilts/013d58c7276f-0002-188c-786ae2e1f629/putAttrs{"admin":true}';
            console.log('hashThis=' + hashThis);
            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(meta.hash, hash, 'The caluculated hash and the one we expect are the same');

            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
