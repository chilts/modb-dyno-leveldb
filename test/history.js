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
var hash1 = 'dbdbab3832f5594e33ded7e286551518';
var hash2 = 'f11e653684a0170fd9373886c1002133';

test('test putItem()', function(t) {
    // put an item, but use our own timestamp
    db.putItem('chilts', timestamp1, item, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test getItem()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        t.equal(changeset.changes, 1, 'The number of changes is 1');
        t.ok(changeset.timestamp, 'The timestamp is a true(ish) value');
        t.equal(changeset.timestamp, timestamp1, 'The timestamp is what we expect');
        t.ok(changeset.hash, 'The hash is a true(ish) value');
        t.equal(changeset.hash, hash1, 'The hash is equal to what we expect');
        t.deepEqual(changeset.value, item, 'Item is what we expect');

        // test that we know what the hash is of
        var hashThis = 'chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem\n{"nick":"chilts"}\n';
        var hash = crypto.createHash('md5').update(hashThis).digest('hex');
        t.equal(changeset.hash, hash, 'The calculated hash and the one we expect are the same');

        t.end();
    });
});

test('test put()', function(t) {
    // add some more attrs, then get it back out again
    db.put('chilts', timestamp2, { 'admin' : true }, function(err, storedItem, meta) {
        t.ok(!err, 'No error when putting some attributes');

        // get this item back
        db.getItem('chilts', function(err, changeset) {
            t.ok(!err, 'No error when getting an item back');

            var currentItem = {
                nick  : 'chilts',
                admin : true,
            };

            t.equal(changeset.changes, 2, 'The number of changes is 2');
            t.ok(changeset.timestamp, 'The timestamp is a true(ish) value');
            t.equal(changeset.timestamp, timestamp2, 'The timestamp is what we expect');
            t.ok(changeset.hash, 'The hash is a true(ish) value');
            t.equal(changeset.hash, hash2, 'The hash is what we expect');
            t.deepEqual(changeset.value, currentItem, 'Item is what we expect');

            // test that we know what the hash is of (the hash of the last changeset, plus this one)
            var hashThis = hash1 + "\n";
            hashThis += 'chilts/' + timestamp2 + '/put\n{"admin":true}\n';
            console.log('hashThis=' + hashThis);
            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(changeset.hash, hash, 'The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
