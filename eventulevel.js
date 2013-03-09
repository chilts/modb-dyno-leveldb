// ----------------------------------------------------------------------------

var _ = require('underscore');
var levelup = require('levelup');

// ----------------------------------------------------------------------------

var EventuLevel = function(filename) {
    var self = this;

    self.db = levelup(filename);
    console.log('db:', self.db);

    return self;
};

// ----------------------------------------------------------------------------

// open(filename, callback) -> (err)
if (false) {
EventuLevel.prototype.open = function(filename, callback) {
    var self = this;

    levelup.open(filename, { create_if_missing: true }, function onOpen(err, db) {
        if (err) callback(err);
        self.db = db;
        callback();
    });
};
}

// ----------------------------------------------------------------------------

// putItem(timestamp, name, item, callback) -> (err)
//
// This replaces the entire item. It does not put individual attributes.
EventuLevel.prototype.putItem = function(name, item, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'putItem');
    self.db.put(key, JSON.stringify(item), callback);
};

// ----------------------------------------------------------------------------

// putAttrs(name, item, timestamp, callback) -> (err)
//
// This replaces just the attributes given in the item specified.
EventuLevel.prototype.putAttrs = function(name, item, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'putAttrs');
    self.db.put(key, JSON.stringify(item), callback);
};

// ----------------------------------------------------------------------------

// delAttrs(timestamp, name, attrs, callback) -> (err)
//
// This makes sure that all attrs in the item are deleted.
EventuLevel.prototype.delAttrs = function(name, attrs, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'delAttrs');
    self.db.put(key, JSON.stringify(attrs), callback);
};

// ----------------------------------------------------------------------------

// getItem(name) -> (err, item)
//
// This gets the item and returns it. It reads *all* of the actions that have happened so far
// and runs through them, making up the final item, which it returns.
EventuLevel.prototype.getItem = function(name, callback) {
    var self = this;

    // start off with a blank item
    var item = {};

    console.log('Getting ' + name + ' ...');

    // figure out the entire range of keys for this name
    var start = '' + name + '/';
    var end   = '' + name + '/~';

    // read through all of the key/value pairs for this item
    self.db.readStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('' + data.key + ' = ' + data.value);

            // get this operation from the key
            var op = data.key.match(/\/(\w+)$/)[1];
            console.log('op=' + op);

            var value = JSON.parse(data.value);

            // depending on the operation, let's do something
            if ( op === 'putItem' ) {
                // replace the entire item
                item = value;
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
            callback(null, item);
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
    return new EventuLevel(filename);
};

// ----------------------------------------------------------------------------
