// ----------------------------------------------------------------------------
//
// Note: this file is a combination of flatten-two.js and flatten-three.js.
//
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

var expectedItem = {
    nick   : 'chilts',
    logins : 10,
};

var timestamp1 = '013d58c7276e-0000-188c-786ae2e1f629';
var timestamp2 = '013d58c7276f-0000-188c-786ae2e1f629';
var timestamp3 = '013d58c7286f-0000-188c-786ae2e1f629';

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', item, timestamp1, function(err) {
        t.ok(!err, 'No error when putting an item');

        db.getItem('chilts', function(err, storedItem, meta) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(storedItem, item, 'Check the stored item is correct');

            // test that we know what the hash is of
            t.equal(meta.hash, 'dbdbab3832f5594e33ded7e286551518', 'The last hash of this item should be this');

            var hashThis = 'chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem\n{"nick":"chilts"}\n';
            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(meta.hash, hash, 'The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test putAttrs()', function(t) {
    // put an item
    db.putAttrs('chilts', { logins : 10 }, timestamp2, function(err) {
        t.ok(!err, 'No error when putting some attributes');

        db.getItem('chilts', function(err, storedItem, meta) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(storedItem, expectedItem, 'Check the stored item is correct');

            // test that we know what the hash is of
            t.equal(meta.hash, '623d9084614b4a00cd591b5d535285ea', 'The last hash of this item should be this');

            var hashThis = "dbdbab3832f5594e33ded7e286551518\n";
            hashThis += "chilts/013d58c7276f-0000-188c-786ae2e1f629/putAttrs\n";
            hashThis += '{"logins":10}\n';

            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(meta.hash, hash, 'The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test flatten()', function(t) {
    // get the item, flatten it, then re-get it
    db.getItem('chilts', function(err, item1, meta1) {
        t.ok(!err, 'No error when getting the item');

        // now flatten the item
        db.flatten('chilts', meta1.hash, function(err) {
            t.ok(!err, 'No error when flattening the item');

            db.getItem('chilts', function(err, item2, meta2) {

                t.deepEqual(item1, expectedItem, '1) Item is identical to expected');
                t.deepEqual(item1, item2, '2) Item is identical after flattening');

                t.equal(meta1.hash, meta2.hash, "Item's hash is still the same");
                t.equal(meta1.changes, meta2.changes, "Item's changes are the same");

                t.end();
            });
        });
    });
});

test('test delAttrs()', function(t) {
    db.delAttrs('chilts', [ 'logins' ], timestamp3, function(err) {
        t.ok(!err, 'No error when deleting some attributes');

        db.getItem('chilts', function(err, storedItem, meta) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(storedItem, item, 'Check the stored item is correct (original item)');

            // test that we know what the hash is of
            t.equal(meta.hash, '04629278d425172fcda6879801c0fd91', 'The last hash of this item should be this');

            var hashThis = "623d9084614b4a00cd591b5d535285ea\n";
            hashThis += "chilts/" + timestamp3 + "/delAttrs\n";
            hashThis += '["logins"]\n';

            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(meta.hash, hash, 'The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test flatten()', function(t) {
    // get the item, flatten it, then re-get it
    db.getItem('chilts', function(err, item1, meta1) {
        t.ok(!err, 'No error when getting the item');

        // now flatten the item
        db.flatten('chilts', meta1.hash, function(err) {
            t.ok(!err, 'No error when flattening the item');

            db.getItem('chilts', function(err, item2, meta2) {

                t.deepEqual(item1, item, '1) Item is identical to expected');
                t.deepEqual(item1, item2, '2) Item is identical after flattening');

                t.equal(meta1.hash, meta2.hash, "Item's hash is still the same");
                t.equal(meta1.changes, meta2.changes, "Item's changes are the same");

                t.end();
            });
        });
    });
});

// ----------------------------------------------------------------------------
