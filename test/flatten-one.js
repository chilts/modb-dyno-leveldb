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

var timestamp1 = '013d58c7276e-0000-188c-786ae2e1f629';

test('test putItem()', function(t) {
    // put an item
    db.putItem('chilts', timestamp1, item, function(err) {
        t.ok(!err, 'No error when putting an item');
        t.end();
    });
});

test('test flatten()', function(t) {
    // get this item back
    db.getItem('chilts', function(err, changeset) {
        t.ok(!err, 'No error when getting an item back');

        t.deepEqual(changeset.value, item, 'Check the stored item is correct');

        // test that we know what the hash is of
        var hashThis = 'chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem\n{"nick":"chilts"}\n';
        var hash = crypto.createHash('md5').update(hashThis).digest('hex');
        t.equal(changeset.hash, hash, 'The calculated hash and the one we expect are the same');
        t.equal(changeset.hash, 'dbdbab3832f5594e33ded7e286551518', 'The last hash of this item should be this');

        db.flatten('chilts', changeset.hash, function(err) {
            t.ok(!err, 'No error when flattening an item');
            t.end();
        });
    });
});

// ----------------------------------------------------------------------------
