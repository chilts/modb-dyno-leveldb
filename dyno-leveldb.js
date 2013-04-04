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

// (itemName, attr, value, timestamp, callback) -> (err)
//
// This adds the value to the item's attr set.
LevelDyno.prototype.addToAttrSet = function(itemName, attr, value, timestamp, callback) {
    var self = this;

    var key = makeKey(itemName, timestamp, 'addToAttrSet');
    self.db.put(key, JSON.stringify({ attr : attr, add : value }), callback);
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
    else if ( op === 'addToAttrSet' ) {
        // make sure the item is a string
        console.log('*** addToAttrSet=' + item[value.attr]);
        if ( value.attr in item ) {
            // Fix: currently we're assuming it is already an object
            console.log('Adding value to set');
            if ( _.isObject(item[value.attr]) ) {
                item[value.attr][value.add] = true;
            }
            else {
                var existing = item[value.attr];
                item[value.attr] = {};
                item[value.attr][existing] = true;
                item[value.attr][value.add] = true;
            }
        }
        else {
            // make a new object and set this value
            console.log('Adding new set');
            item[value.attr] = {};
            item[value.attr][value.add] = true;
        }
    }
    return item;
}

function flattenItem(item) {
    var flatItem = {};

    var totalChanges = 0;
    var lastTimestamp;
    var lastHash = '';

    item.forEach(function(data, i) {

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
        flatItem = performOp(flatItem, op, JSON.parse(thisValue));
    });

    // create the metadata
    var meta = {
        timestamp : lastTimestamp,
        changes   : totalChanges,
        hash      : lastHash,
    };

    if ( Object.keys(flatItem).length === 0 ) {
        return { item : undefined, meta : meta }
    }

    return { item : flatItem, meta : meta };
}

// ----------------------------------------------------------------------------

// getItem(name) -> (err, item, timestamp, changes)
//
// This gets the item and returns it. It reads *all* of the actions that have happened so far
// and runs through them, making up the final item, which it returns.
LevelDyno.prototype.getItem = function(name, callback) {
    var self = this;

    console.log('Getting ' + name + ' ...');

    // figure out the entire range of keys for this name
    var start = '' + name + '/';
    var end   = '' + name + '/~';

    var item = [];

    // read through all of the key/value pairs for this item
    self.db.createReadStream({ start : start, end : end })
        .on('data', function(data) {
            item.push(data);
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            item = flattenItem(item);
            callback(null, item.item, item.meta);
        })
        .on('close', function(data) {
            console.log('Stream closed');
        })
    ;
};

// query(query) -> (err, item, timestamp, changes)
//
// query({ start : 'james', end : 'john' }, callback);
// query({ startEx : 'james', endEx : 'john' }, callback);
//
// This gets the item and returns it. It reads *all* of the actions that have happened so far
// and runs through them, making up the final item, which it returns.
LevelDyno.prototype.query = function(query, callback) {
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
            // split up the key and get the itemName
            var parts = data.key.split(/\//);
            var itemName = parts[0];

            console.log('itemName=' + itemName);

            if ( currentItemName ) {
                if ( itemName === currentItemName ) {
                    currentItem.push(data);
                }
                else {
                    var item = flattenItem(currentItem);
                    items.push(item);
                    currentItem = [];
                    currentItem.push(data);
                }
            }
            else {
                currentItem.push(data);
            }
            currentItemName = itemName;
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            var item = flattenItem(currentItem);
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
LevelDyno.prototype.scan = function(field, value, callback) {
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
            // split up the key and get the itemName
            var parts = data.key.split(/\//);
            var itemName = parts[0];

            console.log('itemName=' + itemName);

            if ( currentItemName ) {
                if ( itemName === currentItemName ) {
                    currentItem.push(data);
                }
                else {
                    var item = flattenItem(currentItem);
                    // only push this item if it fulfils the criteria
                    if ( field && item.item[field] === value ) {
                        items.push(item);
                    }
                    if ( fn && fn(item.item) ) {
                        items.push(item);
                    }
                    currentItem = [];
                    currentItem.push(data);
                }
            }
            else {
                currentItem.push(data);
            }
            currentItemName = itemName;
        })
        .on('error', function(err) {
            console.log('Stream errored:', err);
        })
        .on('end', function(data) {
            var item = flattenItem(currentItem);
            // only push this final item if it fulfils the criteria
            if ( field && item.item[field] === value ) {
                items.push(item);
            }
            if ( fn && fn(item.item) ) {
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
