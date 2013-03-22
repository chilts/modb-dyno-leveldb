# dyno-leveldb - The basic cornerstone of an eventually consistent key/value store. #

'dyno-leveldb' is (on the surface) a key/value store but is also the cornerstone of an eventually-consistent distributed
key/value store. It uses Rod Vagg's excellent [LevelUp](https://npmjs.org/package/levelup) to store the data on
disk. This has other benefits too since LevelDB is great at doing some things (which we'll talk about later).

Every operation that happens to any item in the datastore is timestamped and therefore the history of any object can be
replayed to produce the final result. We timestamp our items by using [flake](https://npmjs.org/package/flake) to
produce approximately sortable practically unique identifiers. This means we get unique timestamps across a number of
distributed machines.

## Example ##

For example, let's say we have a user called 'chilts' and we want to perform the following operations:

* put a user with a nickname and an email address
* increment the number of logins
* delete the email address
* add a real name
* re-add a different email address

Let's see what this looks like in LevelDB once this sequence of events has happened:

```
chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem   = {"nick":"chilts","email":"me@example.com"}
chilts/013d58c7276e-0001-188c-786ae2e1f629/incAttrBy = {"field":"logins","by":1}
chilts/013d58c7276e-0002-188c-786ae2e1f629/delAttrs  = ["email"]
chilts/013d58c7276e-0003-188c-786ae2e1f629/putAttrs  = {"name":"Andy Chilton"}
chilts/013d58c7276e-0004-188c-786ae2e1f629/putAttrs  = {"email":"me@example.net"}
```

This would give an eventual value of:

```
{"nick":"chilts","logins":1,"email":"me@example.net","name":"Andy Chilton"}
```

## Keys and Values ##

As you can see, the keys consist of a few different things. For example:

```
key       = chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem
item name = chilts
timestamp = 013d58c7276e-0000-188c-786ae2e1f629
operation = putItem
```

Most of these are easy to understand, but if you'd like to know more about approximately sortable practically unique
timestamps, see [flake](https://npmjs.org/package/flake).

The reason the key contains so much is to help dyno-leveldb reconstruct the eventual value of this item. So, let's see how we would make such an item. The above steps would look something like this:

## Example Code ##

Using dyno-leveldb is not much different to using other types of databases. Essentially you can do similar or slightly
different operations. You can put an item and get it back much like any other database. But you can also do things like
increment a key, delete certain attributes or even add or remove an item from a set.

Let's take a look at some code which results in the above item:

```
var timestamp = require('flake')('eth0');

// use dyno-leveldb and open a new datastore
var dyno = require('./dyno-leveldb.js');

// open a new database
var db = dyno('/tmp/users');

// do the above sequence
db.putItem('chilts', { nick : 'chilts', email : 'me@example.com' }, timestamp());
db.incAttrBy('chilts', logins, 1, timestamp());
db.delAttrs('chilts', [ 'email' ], timestamp());
db.putAttrs('chilts', { name : 'Andy Chilton' }, timestamp());
db.putAttrs('chilts', { email : 'me@example.net' }, timestamp());
```

And to get the item back out:

```
// get the item back out
db.getItem('chilts', function(err, item) {
    if (err) {
        console.log('err:', err);
        return;
    }
    console.log(item);
});
```

When retrieving an item from dyno-leveldb, we're using special properties of the LevelDB implementation to help make it
fast. LevelDB is great at reading a sequence of keys which are sequential to each other. We use this property of
LevelDB by storing all changeses for an item sequentially by starting each key with the item name and the (orderable)
timestamp. This makes it easy to retrieve all changesets for an item and replay them, before finally returning the
eventual item's value.

## Flattening an Item ##

Over time, an item can grow to become quite a number of operations. In these cases we want to flatten the item so that it takes up just one row in LevelDB rather than the number of rows it currently takes. When you get an item from dyno-leveldb, you also receive a meta data object containing some iteresting fields:

```
// get the item back out
db.getItem('chilts', function(err, item, meta) {
    if (err) {
        console.log('err:', err);
        return;
    }
    console.log('item:', item);
    console.log('meta:', meta);
});
```

The metadata may look like this:

```
meta: {
    timestamp : '013d58c7276e-0004-188c-786ae2e1f629',
    changes   : 5,
    hash      : '45577fd049c76fc65cfd81a4f4e7110f'
}
```

As you can see, there are 5 changesets (putItem, incAttrBy, delAttrs, putAttrs, putAttrs), the latest timestamp is show
and the hash is a long set of characters.

It's this hash which is the most interesting. What this hash says is that if you hash each and every changeset, you end
up with this hash. Take note of this idea, since it is important when we start using dyno-leveldb in a distributed
environment. If another instance of level-node has these exact same 5 operations, with the same timestamps and the same
values, then we can be sure that both instances are *exactly* the same.

But for now, let's just see what happens if we flatten this item to just one row in LevelDB:

```
// get the item back out
db.getItem('chilts', function(err, item, meta) {
    db.flatten('chilts', meta.hash, function(err) {
        console.log('Flattened);
    })
});
```

LevelDB now shows that we have gone from 5 rows, to just one:

```
chilts/013d76d069e8-0000-62fd-984be1b8b104/putItem = {"nick":"chilts","email":"me@example.com"}
chilts/013d76d069e8-0001-62fd-984be1b8b104/incAttrBy = {"field":"logins","by":1}
chilts/013d76d069e9-0000-62fd-984be1b8b104/delAttrs = ["email"]
chilts/013d76d069e9-0001-62fd-984be1b8b104/putAttrs = {"name":"Andy Chilton"}
chilts/013d76d069e9-0002-62fd-984be1b8b104/putAttrs = {"email":"me@example.net"}
-> 
chilts/013d76d069e9-0002-62fd-984be1b8b104/history = c4d456f080f69b1df6256dc2802f3ff5:5:{"nick":"chilts","logins":1,"name":"Andy Chilton","email":"me@example.net"}
```

As you can see, the item now shows the eventual item value in it's entirity. It also shows the number of changesets
contained in it and the hash of the last changeset (remember, this hash implies the previous 4 changesets too).

So, let's do something else to the item, and remove the name:

```
chilts/013d76d069e9-0002-62fd-984be1b8b104/history = c4d456f080f69b1df6256dc2802f3ff5:5:{"nick":"chilts","logins":1,"name":"Andy Chilton","email":"me@example.net"}
chilts/013d76fdadce-0000-792d-984be1b8b104/delAttrs = ["name"]
```

So, once an item has been flattened, you can just keep adding/editing/deleting from it as you see fit.

To run these examples, try running each of these in the ```examples/``` directory:

```
node examples/01-add-user.js
node examples/dump.js
node examples/02-get-item.js
node examples/flatten.js
node examples/dump.js
node examples/04-remove-name.js
node examples/dump.js
node examples/flatten.js
node examples/dump.js
```

# Author #

Written by [Andrew Chilton](http://chilts.org/) - [Blog](http://chilts.org/blog/) -
[Twitter](https://twitter.com/andychilton).

# License #

* http://chilts.mit-license.org/2013/

(Ends)
