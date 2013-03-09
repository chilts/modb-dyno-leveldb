# EvntuLevel - Enventually Level #

EventuLevel is (on the surface) a key/value store but is the cornerstone of an eventually-consistent distributed
key/value store.

It has a similar idea to Dominic Tarr's "crdt", except everything is stored in LevelDB (using Rod Vagg's LevelUp).

Every operation that happens to any item in the datastore is timestamped and therefore the history of any object can be
replayed to produce the final result.

For example, if we set the key 'chilts' to be { name : 'Andy Chilton', age : 101 }, then put another attribute { feet :
2 }, followed by a delete of the 'age' attribute, the final object would be { name : 'Andy Chilton', feet : 2 }.

In code, this would look like:

```
// use EventuLevel and open a new datastore
var eventulevel = require('./eventulevel.js');
var el = eventulevel('store/people');

// do the above sequence
el.putItem('chilts', { name : 'Andy Chilton', age : 101 });
el.delAttrs('chilts', [ 'age' ]);
el.putAttrs('chilts', { feet : 2 });

// get the item back out
el.getItem('chilts', function(err, item) {
    console.log(item); // gives { name : 'Andy Chilton', feet : 2 }
});
```

(Ends)
