// ----------------------------------------------------------------------------

var underscore = require('underscore');
var async = require('async');
var tap = require('tap');

var helpers = require('./helpers.js');

var plan = tap.plan;
var test = tap.test;

// ----------------------------------------------------------------------------

var db = helpers.newDyno();
var ts = helpers.timestamp;

// ----------------------------------------------------------------------------

// let's loop through some items and put them
var names = [
    'zebedee', 'chilts', 'gerry', 'alien', 'goff', 'green-fingers', 'xeetee', 'alex',
    'jessie', 'sinead', 'evaniscule', 'evan', 'karl', 'carl', 'alexis', 'q', 'alex-1980',
];

test('test putItem()', function(t) {
    // put some items
    var i = 0;
    var admin = true;
    async.each(
        names,
        function(item, done) {
            i++;
            admin = !admin;
            db.putItem(item, ts(), { id : i, nick : item, admin : admin }, function(err) {
                db.inc(item, ts(), 'logins', function(err) {
                    db.put(item, ts(), { upper : item.toUpperCase() }, function(err) {
                        db.inc(item, ts(), 'logins', done);
                    });
                });
            });
        },
        function(err) {
            t.ok(!err, 'No error inserting lots of names');
            t.end();
        }
    );
});

test('test scan()', function(t) {
    // query the entire table for people who are admin
    db.scan('admin', true, function(err, items) {
        t.equal(items.length, 8, 'Got 8 admins');
        t.end();
    });
});

test('test scan()', function(t) {
    // query the entire table for people who's nicks begin with 'g'
    db.scan(function(item) { return item.value.nick.match(/^g/) }, function(err, items) {
        t.equal(items.length, 3, "Got three people whos nicks begin with 'g'");
        t.end();
    });
});

// ----------------------------------------------------------------------------
