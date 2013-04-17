// ----------------------------------------------------------------------------

var crypto = require('crypto');
var util = require('util');

var levelup = require('levelup');

var DynoAbstract = require('dyno-abstract');

// ----------------------------------------------------------------------------

var DynoLevelDB = function(filename) {
    var self = this;

    // ToDo: call the parent constructor

    // create or open the datastore
    self.db = levelup(filename);

    return self;
};
util.inherits(DynoLevelDB, DynoAbstract);

// ----------------------------------------------------------------------------
// internal functions useful for LevelDB

// Keys : look like "itemName/timestamp/operation"
// ToDo: should probably move operation out to the value.

DynoAbstract.prototype._makeKey = function makeKey(name, timestamp, operation) {
    return name + '/' + timestamp + '/' + operation;
}

DynoAbstract.prototype._splitKey = function makeKey(key) {
    var parts = key.split(/\//);
    return {
        itemName  : parts[0],
        timestamp : parts[1],
        operation : parts[2],
    };
}

// ----------------------------------------------------------------------------

// _putOperation(operationName, itemName, timestamp, operation, change, callback) -> (err)
//
// This replaces the entire item. It does not put individual attributes.
DynoLevelDB.prototype._putOperation = function(operationName, itemName, timestamp, change, callback) {
    var self = this;
    var key = self._makeKey(itemName, timestamp, operationName);
    self.db.put(key, JSON.stringify(change), function(err, res) {
        console.log('_putOperation(): err:', err);
        callback(err, res);
    });
};


// query(query) -> (err, item, timestamp, changes)
//
// query({ start : 'james', end : 'john' }, callback);
// query({ startEx : 'james', endEx : 'john' }, callback);
//
// This gets the item and returns it. It reads *all* of the actions that have happened so far
// and runs through them, making up the final item, which it returns.
DynoLevelDB.prototype.query = function(query, callback) {
    var self = this;

    // figure out the entire range of keys for this query
    var start = '' + query.start + '/';
    var end   = '' + query.end + '/~';

    // let's start scanning the table for all items and changesets
    var items = [];
    var currentItem = [];
    var currentItemName;
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('* ' + data.key + ' = ' + data.value);

            // get the changeset
            var changeset = self._decode(data);
            var itemName = changeset.name;

            console.log('itemName=' + itemName);

            if ( currentItemName ) {
                if ( changeset.name === currentItemName ) {
                    currentItem.push(changeset);
                }
                else {
                    var item = self.reduce(currentItem);
                    items.push(item);
                    currentItem = [];
                    currentItem.push(changeset);
                }
            }
            else {
                currentItem.push(changeset);
            }

            // remember this itemName for next time
            currentItemName = changeset.name;
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            var item = self.reduce(currentItem);
            items.push(item);
        })
        .on('close', function() {
            console.log('Stream closed');

            // ok, let's print it all out for now
            console.log(items);

            callback(null, items);
        })
    ;
};

// scan(field, value, callback) -> (err, items)
// scan(fn, callback) -> (err, items)
//
// scan('admin', true, callback);
// scan('favColour', 'red', callback);
//
// This scans through all the items in the DB and returns any that fulfil the criteria.
DynoLevelDB.prototype.scan = function(field, value, callback) {
    var self = this;

    var fn;
    if ( !callback && typeof field === 'function' ) {
        fn = field;
        callback = value;
        field = null
        value = null;
    }

    // figure out the entire range of keys for this query
    var start = '\x00';
    var end   = '\xFF';

    // let's start scanning the table for all items and changesets
    var items = [];
    var currentItem = [];
    var currentItemName;
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('* ' + data.key + ' = ' + data.value);

            // decode this item
            var changeset = self._decode(data);
            console.log('this changeset :', changeset);
            console.log('itemName=' + changeset.name);

            if ( currentItemName ) {
                if ( changeset.name === currentItemName ) {
                    currentItem.push(changeset);
                }
                else {
                    var item = self.reduce(currentItem);
                    console.log('reduced to :', item);
                    // only push this item if it fulfils the criteria
                    if ( field && item.value[field] === value ) {
                        items.push(item);
                    }
                    if ( fn && fn(item) ) {
                        items.push(item);
                    }
                    currentItem = [];
                    currentItem.push(changeset);
                }
            }
            else {
                currentItem.push(changeset);
            }

            // remember this last itemName
            currentItemName = changeset.name;
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            var item = self.reduce(currentItem);
            // only push this final item if it fulfils the criteria
            if ( field && item.value[field] === value ) {
                items.push(item);
            }
            if ( fn && fn(item) ) {
                items.push(item);
            }
        })
        .on('close', function() {
            console.log('Stream closed');

            // ok, let's print it all out for now
            console.log(items);

            callback(null, items);
        })
    ;
};

// ----------------------------------------------------------------------------

// flatten(itemName, hash) -> (err)
//
// This gets out all of the changes for this itemName and instruments them with
// their changes and hashes. It then loops through each one and checks to see if
// it correlates with the hash provided.
//
// At this point it replaces the history up to this point with flattened history
// operation.
//
// If we run through the entire item's history and we never find the hash
// then we'll return an error.
DynoLevelDB.prototype.flatten = function(itemName, flattenToHash, callback) {
    var self = this;

    console.log('flatten(): entry - hash=' + flattenToHash);

    // firstly, get the history
    self._getChangesets(itemName, function(err, changesets) {
        if (err) return callback(err);

        // instrument the changesets with their meta data
        changesets = self.instrumentChangesets(changesets);

        // now loop through finding the hash
        var upto;
        changesets.forEach(function(changeset, i) {
            if ( changeset.hash === flattenToHash ) {
                upto = i;
            }
        });
        console.log('Found hash at position ' + upto);
        callback(null, upto);
    });
};

// ----------------------------------------------------------------------------
// changesets

// _getChangesets(itemName, callback) -> (err, changesets)
//
// This gets the changesets from the backend storage.
DynoLevelDB.prototype._getChangesets = function(itemName, callback) {
    var self = this;

    // figure out the entire range of keys for this itemName
    var start = '' + itemName + '/';
    var end   = '' + itemName + '/~';

    var changesets = [];

    // read through all of the key/value pairs for this item
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            // make decoding this data(key/value) easier
            var changeset = self._decode(data);
            changesets.push(changeset);
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            callback(null, changesets);
        })
        .on('close', function(data) {
            console.log('Stream closed');
        })
    ;
};

// _decode(data, callback) -> (changeset)
//
// data: the data from LevelDB, which consists of data.key and data.value. We need to decode both.
//
// A changeset always has the following keys
// * name
// * timestamp
// * operation
//
// And contains the following for most regular operations:
// * change
//
// But contains the following for the 'history' operation (not 'change'):
// * hash
// * changes
// * item
//
// Also note that when a changeset is instrumented, each change also contains a hash, changes and value (in some cases
// in addition to the change, since it hasn't been reduced yet).
DynoLevelDB.prototype._decode = function(data) {
    // changeset in this case is a row from LevelDB, which contains 'key' and 'value'

    var changeset = {};

    // get this operation from the key
    var parts = data.key.split(/\//);
    var itemName = parts[0];
    var currentTimestamp = parts[1];
    var op = parts[2];

    changeset.name      = parts[0];
    changeset.timestamp = parts[1];
    changeset.operation = parts[2];

    // assert(itemName === name);

    // figure out the history of _this_ item
    if ( op === 'history' ) {
        var history = data.value.match(/^([0-9a-f]+)\:(\d+):(.*)$/);
        console.log('*** history:', history);

        // since we have a history op, then we already know the hash, changes and item (but not _this_ change)
        changeset.hash    = history[1];
        changeset.changes = history[2] | 0;
        changeset.item    = history[3];
    }
    else {
        // since we have a regular operation, we only know _this_ change
        changeset.change = JSON.parse(data.value);
    }

    console.log('changeset:', changeset);

    return changeset;
};

// ----------------------------------------------------------------------------

// an internal function to delete a number of keys at the same time, but also insert a new one.
//
// _replace(name, [changes, ...], history)
//
// e.g. _replace(changes, with)
//
// Where:
// * changes = [ ]
// * history = { hash : '...', changes : 4, value : "{ ... }",  }

// ----------------------------------------------------------------------------

// the createDynoLevelDB() function
module.exports = exports = function createDynoLevelDB(filename) {
    return new DynoLevelDB(filename);
};

// ----------------------------------------------------------------------------
