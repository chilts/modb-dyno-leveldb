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

var obj = {
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
    db.putItem('chilts', timestamp1, obj, function(err) {
        t.ok(!err, 'No error when putting an item');

        db.getItem('chilts', function(err, item) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(item.value, obj, '1) Check the stored item is correct');

            // test that we know what the hash is of
            t.equal(item.hash, 'dbdbab3832f5594e33ded7e286551518', '1) The last hash of this item should be this');

            var hashThis = 'chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem\n{"nick":"chilts"}\n';
            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(item.hash, hash, '1) The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test put()', function(t) {
    // put an item
    db.put('chilts', timestamp2, { logins : 10 }, function(err) {
        t.ok(!err, 'No error when putting some attributes');

        db.getItem('chilts', function(err, item) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(item.value, expectedItem, '2) Check the stored item is correct');

            // test that we know what the hash is of
            t.equal(item.hash, '897547f3b4f8f6e09785a8aa3e79e32d', '2) The last hash of this item should be this');

            var hashThis = "dbdbab3832f5594e33ded7e286551518\n";
            hashThis += "chilts/013d58c7276f-0000-188c-786ae2e1f629/put\n";
            hashThis += '{"logins":10}\n';

            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(item.hash, hash, '2) The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test del()', function(t) {
    db.del('chilts', timestamp3, [ 'logins' ], function(err) {
        t.ok(!err, 'No error when deleting some attributes');

        db.getItem('chilts', function(err, item) {
            t.ok(!err, 'No error when getting an item back');

            t.deepEqual(item.value, obj, '3) Check the stored item is correct (original item)');

            // test that we know what the hash is of
            t.equal(item.hash, '72d2fe100cd3dbf6da4948d01fb455db', '3) The last hash of this item should be this');

            var hashThis = "897547f3b4f8f6e09785a8aa3e79e32d\n";
            hashThis += "chilts/" + timestamp3 + "/del\n";
            hashThis += '["logins"]\n';

            var hash = crypto.createHash('md5').update(hashThis).digest('hex');
            t.equal(item.hash, hash, '3) The calculated hash and the one we expect are the same');

            t.end();
        });
    });
});

test('test flatten()', function(t) {
    // get the item, flatten it, then re-get it
    db.getItem('chilts', function(err, item1) {
        t.ok(!err, 'No error when getting the item');

        // now flatten the item
        db.flatten('chilts', item1.hash, function(err) {
            t.ok(!err, 'No error when flattening the item');

            db.getItem('chilts', function(err, item2) {

                t.deepEqual(item1.value, obj, '4) Item is identical to expected');
                t.deepEqual(item1, item2, '4) Item is identical after flattening');

                t.equal(item1.hash, item2.hash, "4) Item's hash is still the same");
                t.equal(item1.changes, item2.changes, "4) Item's changes are the same");

                t.end();
            });
        });
    });
});

// ----------------------------------------------------------------------------
