// ----------------------------------------------------------------------------

var _ = require('underscore');
var levelup = require('levelup');

// ----------------------------------------------------------------------------

var LevelDyno = function(filename) {
    var self = this;

    self.db = levelup(filename);
    console.log('db:', self.db);

    return self;
};

// ----------------------------------------------------------------------------

// open(filename, callback) -> (err)
if (false) {
LevelDyno.prototype.open = function(filename, callback) {
    var self = this;

    levelup.open(filename, { create_if_missing: true }, function onOpen(err, db) {
        if (err) callback(err);
        self.db = db;
        callback();
    });
};
}

// ----------------------------------------------------------------------------

// putItem(name, item, timestamp, callback) -> (err)
//
// This replaces the entire item. It does not put individual attributes.
LevelDyno.prototype.putItem = function(name, item, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'putItem');
    self.db.put(key, JSON.stringify(item), callback);
};

// ----------------------------------------------------------------------------

// delItem(name, timestamp, callback) -> (err)
//
// This makes sure that all attrs in the item are deleted.
LevelDyno.prototype.delItem = function(name, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'delItem');
    self.db.put(key, JSON.stringify({}), callback);
};

// ----------------------------------------------------------------------------

// putAttrs(name, item, timestamp, callback) -> (err)
//
// This replaces just the attributes given in the item specified.
LevelDyno.prototype.putAttrs = function(name, item, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'putAttrs');
    self.db.put(key, JSON.stringify(item), callback);
};

// ----------------------------------------------------------------------------

// delAttrs(timestamp, name, attrs, callback) -> (err)
//
// This makes sure that all attrs in the item are deleted.
LevelDyno.prototype.delAttrs = function(name, attrs, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'delAttrs');
    self.db.put(key, JSON.stringify(attrs), callback);
};

// ----------------------------------------------------------------------------

// getItem(name) -> (err, item, timestamp, changes)
//
// This gets the item and returns it. It reads *all* of the actions that have happened so far
// and runs through them, making up the final item, which it returns.
LevelDyno.prototype.getItem = function(name, callback) {
    var self = this;

    // start off with a blank item
    var item = {};

    console.log('Getting ' + name + ' ...');

    // figure out the entire range of keys for this name
    var start = '' + name + '/';
    var end   = '' + name + '/~';

    // remember the count of changesets and the last timestamp we read
    var changes = 0;
    var lastTimestamp;
    // ToDo: remember the hash of all the changesets (ie. just their times)

    // read through all of the key/value pairs for this item
    self.db.readStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('' + data.key + ' = ' + data.value);

            // get this operation from the key
            var parts = data.key.split(/\//);
            var itemName = parts[0];
            var timestamp = parts[1];
            var op = parts[2];

            // remember where we are up to
            lastTimestamp = timestamp;
            changes++;

            var value = JSON.parse(data.value);

            // depending on the operation, let's do something
            if ( op === 'putItem' ) {
                // replace the entire item
                item = value;
            }
            else if ( op === 'delItem' ) {
                item = {};
            }
            else if ( op === 'putAttrs' ) {
                item = _.extend(item, value);
            }
            else if ( op === 'delAttrs' ) {
                value.forEach(function(v, i) {
                    delete item[v];
                });
            }
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            console.log('Stream ended');
            if ( Object.keys(item).length === 0 ) {
                return callback();
            }
            callback(null, item, lastTimestamp, changes);
        })
        .on('close', function(data) {
            console.log('Stream closed');
        })
    ;
};

// ----------------------------------------------------------------------------

// flatten(name, timestamp) -> (err)
//
// This runs through the first lot of changes up to the timestamp
// and replaces them with what the item is at that point.
LevelDyno.prototype.flatten = function(name, timestamp, callback) {
    var self = this;

    // start off with a blank item and remember the ops we want to perform
    var item = {};
    var ops = [];

    console.log('Getting ' + name + ' ...');

    // figure out the range of keys specified for this timestamp
    var start = '' + name + '/';
    var end   = '' + name + '/' + timestamp + '~';

    // read through all of the key/value pairs for this item
    self.db.readStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('' + data.key + ' = ' + data.value);

            // get this operation from the key
            var parts = data.key.split(/\//);
            var itemName = parts[0];
            var timestamp = parts[1];
            var op = parts[2];

            var value = JSON.parse(data.value);

            // remove this key when we eventually get to replace all of this
            ops.push({
                type : 'del',
                key  : data.key,
            });

            // depending on the operation, let's do something
            if ( op === 'putItem' ) {
                // replace the entire item
                item = value;
            }
            else if ( op === 'delItem' ) {
                item = {};
            }
            else if ( op === 'putAttrs' ) {
                item = _.extend(item, value);
            }
            else if ( op === 'delAttrs' ) {
                value.forEach(function(v, i) {
                    delete item[v];
                });
            }
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            console.log('Stream ended');

            // replace all the history with one putItem
            ops.push({
                type : 'put',
                key  : makeKey(name, timestamp, 'putItem'),
                value : JSON.stringify(item),
            });
            self.db.batch(ops, callback);
        })
        .on('close', function(data) {
            console.log('Stream closed');
        })
    ;
};

// ----------------------------------------------------------------------------
// helper functions

function makeKey(name, timestamp, operation) {
    return name + '/' + timestamp + '/' + operation;
}

// ----------------------------------------------------------------------------

module.exports = exports = function(filename) {
    return new LevelDyno(filename);
};

// ----------------------------------------------------------------------------
