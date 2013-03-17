// ----------------------------------------------------------------------------

var crypto = require('crypto');

var _ = require('underscore');
var levelup = require('levelup');

// ----------------------------------------------------------------------------

var LevelDyno = function(filename) {
    var self = this;

    self.db = levelup(filename);

    return self;
};

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

// incAttr(name, attr, timestamp, callback) -> (err)
//
// This increments the attribute, or sets it to 'by' if it doesn't yet exist.
LevelDyno.prototype.incAttr = function(name, attr, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'add');
    self.db.put(key, JSON.stringify({ field : attr, by : 1 }), callback);
};

// ----------------------------------------------------------------------------

// incAttrBy(name, attr, by, timestamp, callback) -> (err)
//
// This increments the attribute, or sets it to 'by' if it doesn't yet exist.
LevelDyno.prototype.incAttrBy = function(name, attr, by, timestamp, callback) {
    var self = this;

    // ToDo: check 'by' is a number

    var key = makeKey(name, timestamp, 'add');
    self.db.put(key, JSON.stringify({ field : attr, by : by }), callback);
};

// ----------------------------------------------------------------------------

// decAttr(name, attr, timestamp, callback) -> (err)
//
// This decrements the attribute, or sets it to -by if it doesn't yet exist.
LevelDyno.prototype.decAttr = function(name, attr, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'add');
    self.db.put(key, JSON.stringify({ field : attr, by : -1 }), callback);
};

// ----------------------------------------------------------------------------

// decAttrBy(name, attr, timestamp, callback) -> (err)
//
// This decrements the attribute, or sets it to -by if it doesn't yet exist.
LevelDyno.prototype.decAttrBy = function(name, attr, by, timestamp, callback) {
    var self = this;

    // ToDo: check 'by' is a number

    var key = makeKey(name, timestamp, 'add');
    self.db.put(key, JSON.stringify({ field : attr, by : -by }), callback);
};

// ----------------------------------------------------------------------------

// append(name, attr, str, timestamp, callback) -> (err)
//
// This appends the 'str' to the attributes.
LevelDyno.prototype.append = function(name, attr, str, timestamp, callback) {
    var self = this;

    var key = makeKey(name, timestamp, 'append');
    self.db.put(key, JSON.stringify({ field : attr, str : str }), callback);
};

// ----------------------------------------------------------------------------

function performOp(item, op, value) {
    if ( op === 'history' ) {
        // replace the entire item
        item = value;
    }
    else if ( op === 'putItem' ) {
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
    else if ( op === 'add' ) {
        // does incAttr, incAttrBy, decAttr, decAttrBy
        if ( typeof item[value.field] === 'number' ) {
            item[value.field] += value.by;
        }
        else {
            // overwrite the item (since we don't ever want to error)
            item[value.field] = value.by;
        }
    }
    else if ( op === 'append' ) {
        // make sure the item is a string
        console.log('*** = ' + item[value.field]);
        if ( typeof item[value.field] !== 'undefined' ) {
            item[value.field] = '' + item[value.field] + value.str;
        }
        else {
            // just set it to the string
            item[value.field] = value.str;
        }
    }
    return item;
}

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
    var totalChanges = 0;
    var lastTimestamp;
    var lastHash = '';
    // ToDo: remember the hash of all the changesets (ie. just their times)

    // read through all of the key/value pairs for this item
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('* ' + data.key + ' = ' + data.value);

            // Each changeset has a key and a value. Every key is the same but every value may be one of two forms:
            // key = itemName/timestamp/operation
            // val = ( json | history/changes/json )

            // get this operation from the key
            var parts = data.key.split(/\//);
            var itemName = parts[0];
            var currentTimestamp = parts[1];
            var op = parts[2];

            // assert(itemName === name);

            // figure out the history of _this_ item
            var currentHash, thisValue;
            if ( op === 'history' ) {
                var history = data.value.match(/^([0-9a-f]+)\:(\d+):(.*)$/);
                console.log('*** history:', history);
                currentHash = history[1];
                totalChanges = parseInt(history[2]);
                thisValue = history[3];
            }
            else {
                // this is a regular operation
                var hashThis = '';
                if ( lastHash ) {
                    hashThis = lastHash + "\n";
                }
                hashThis += data.key + "\n" + data.value + "\n";
                currentHash = crypto.createHash('md5').update(hashThis).digest('hex');
                totalChanges++;
                thisValue = data.value;
            }

            // remember these
            lastHash = currentHash;
            lastTimestamp = currentTimestamp;

            // perform this operation
            item = performOp(item, op, JSON.parse(thisValue));
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            console.log('Stream ended');
            if ( Object.keys(item).length === 0 ) {
                return callback();
            }

            // now call back with the item and the metadata
            var meta = {
                timestamp : lastTimestamp,
                changes   : totalChanges,
                hash      : lastHash,
            };
            callback(null, item, meta);
        })
        .on('close', function(data) {
            console.log('Stream closed');
        })
    ;
};

// ----------------------------------------------------------------------------

// flatten(name, hash) -> (err)
//
// This runs through the first lot of changes up to where the hash is the same,
// and replaces them with what the item is at that point.
//
// If we run through the entire item's history and we never find the hash
// then we'll return an error.
LevelDyno.prototype.flatten = function(name, flattenToHash, callback) {
    var self = this;

    console.log('flatten(): entry - hash=' + flattenToHash);

    // start off with a blank item and remember the ops we want to perform
    var item = {};
    var ops = [];

    console.log('Getting ' + name + ' ...');

    // figure out the range of keys specified for this timestamp
    var start = '' + name + '/';
    var end   = '' + name + '/~';

    // remember the last hash
    var lastHash;
    var found = false;

    var totalChanges = 0;

    // read through all of the key/value pairs for this item
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            console.log('* ' + data.key + ' = ' + data.value);

            // if we have already found this hash, then just return
            if ( found ) {
                return;
            }

            // get this operation from the key
            var parts = data.key.split(/\//);
            var itemName = parts[0];
            var currentTimestamp = parts[1];
            var op = parts[2];

            // figure out the history of _this_ item
            var currentHash, thisValue;
            if ( op === 'history' ) {
                var history = data.value.match(/^([0-9a-f]+)\:(\d+):(.*)$/);
                currentHash = history[1];
                totalChanges = parseInt(history[2]);
                thisValue = history[3];
            }
            else {
                // this is a regular operation
                var hashThis = '';
                if ( lastHash ) {
                    hashThis = lastHash + "\n";
                }
                hashThis += data.key + "\n" + data.value + "\n";
                console.log('hashThis=' + hashThis);
                currentHash = crypto.createHash('md5').update(hashThis).digest('hex');
                totalChanges++;
                thisValue = data.value;
            }

            console.log('currentHash=' + currentHash);

            // remember these
            lastHash = currentHash;
            lastTimestamp = currentTimestamp;

            // remove this key when we eventually get to replace all of this history
            ops.push({
                type : 'del',
                key  : data.key,
            });

            // perform this operation so we have the latest
            item = performOp(item, op, JSON.parse(thisValue));

            // see if we have reached the hash that we want to flatten
            if ( flattenToHash === currentHash ) {
                // yes, we have reached the changeset we wish to flatten
                console.log('YES! We have found the correct history hash to flatten');

                // ToDo: finish this LevelUp query so we don't have to go through the rest of the keys

                // ToDo: check if the history contains only one item, since there is no point flattening that

                // replace all of this history with one history operation
                ops.push({
                    type : 'put',
                    key  : makeKey(name, currentTimestamp, 'history'),
                    value : '' + currentHash + ':' + totalChanges + ':' + JSON.stringify(item),
                });

                // remember that we have found this history hash
                found = true;

                // now, call .batch() to do the del/put and callback
                self.db.batch(ops, callback);
            }
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
            // send this to the callback
            callback(err);
        })
        .on('end', function(data) {
            console.log('Stream ended, found=' + found);

            // see if we found the history hash or not
            if ( found ) {
                // we have already flattened and called the callback in the 'data' event above
            }
            else {
                callback(new Error('Could not find this history hash in this item'));
            }
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

// the createLevelDyno() function
module.exports = exports = function createLevelDyno(filename) {
    return new LevelDyno(filename);
};

// ----------------------------------------------------------------------------
