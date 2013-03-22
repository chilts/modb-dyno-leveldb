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
    async.each(
        names,
        function(item, done) {
            i++;
            db.putItem(item, { id : i, nick : item }, ts(), function(err) {
                db.incAttr(item, 'logins', ts(), function(err) {
                    db.putAttrs(item, { upper : item.toUpperCase() }, ts(), function(err) {
                        db.incAttr(item, 'logins', ts(), done);
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

test('test query()', function(t) {
    // query this table for people between 

    db.query({ start : 'chilts', end : 'goff' }, function(err, items) {
        t.ok(items.length, 'Got something from the query()');
        t.end();
    });
});

// ----------------------------------------------------------------------------