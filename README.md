# level-dyno - The basic cornerstone of an eventually consistent key/value store. #

'dyno' is (on the surface) a key/value store but is also the cornerstone of an eventually-consistent distributed
key/value store.

Every operation that happens to any item in the datastore is timestamped and therefore the history of any object can be
replayed to produce the final result.

For example, let's say we have a user called 'chilts' and we want to perform the following operations:

* put { nick : 'chilts', email : 'me@example.com' }
* delete the email address
* add a real name
* re-add a different email address
* retrieve user

In code, this would look like:

```
// use level-dyno and open a new datastore
var dyno = require('./level-dyno.js');

// open a new database
var db = dyno('/tmp/users');

// do the above sequence
db.putItem('chilts', { nick : 'chilts', email : 'me@example.com' });
db.delAttrs('chilts', [ 'email' ]);
db.putAttrs('chilts', { name : 'Andy Chilton' });

// get the item back out
db.getItem('chilts', function(err, item) {
    // gives { nick : 'chilts', name : 'Andy Chilton' }
    console.log(item);
});
```

So, what does this look like in LevelDB:

```
chilts/013d58c7276e-0000-188c-786ae2e1f629/putItem = {"nick":"chilts","email":"me@example.com"}
chilts/013d58c7276e-0001-188c-786ae2e1f629/delAttrs = ["email"]
chilts/013d58c7276e-0002-188c-786ae2e1f629/putAttrs = {"name":"Andy Chilton"}
```

As you can see, each operation is ordered (we're using the fantastic [flake](https://npmjs.org/package/flake) module
for this) and therefore when you replay these operations in order, you'll get back the exact copy you expect.

Now, let's tell level-dyno that the value we have received from it using the last 4 timestamps is the correct value and
that it should flatten each of the 4 operations into one.

```
// use level-dyno and open a new datastore
var dyno = require('./level-dyno.js');

// open a new database
var db = dyno('/tmp/users');

// get the item back out
db.getItem('chilts', function(err, item, lastTimestamp, changes) {
    console.log('There have been ' + changes + ' changes to this item');
    console.log('The last change occurred at ' + timestamp);
    console.log('Item: ', item);

    // tell level-dyno that what it has passed back is correct (which you need to verify in some other way to
    // just using level-dyno itself) and to flatten the history into one
    db.flatten('chilts', timestamp, function(err) {
        console.log('This item is now flattened');
    });
});
```

And again, to show what this now looks like in LevelDB:

```
chilts/013d58c7276e-0003-188c-786ae2e1f629/putItem = {"name":"Andy Chilton","name":"Andy Chilton"}
```

As you can see, all three operations (putItem, delAttrs, putAttrs) has now been flattened into just one putItem.

## Uses ##

On it's own, level-dyno isn't that useful since essentially it is just one table and also, using LevelDB directly makes
a lot more sense. However, used in a distributed datastore, level-dyno can be used as the basis of your storage using
just these simple operations above.

(Ends)
