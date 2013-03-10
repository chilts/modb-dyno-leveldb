# level-dyno - The basic cornerstone of an eventually consistent key/value store. #

'dyno' is (on the surface) a key/value store but is also the cornerstone of an eventually-consistent distributed
key/value store.

Every operation that happens to any item in the datastore is timestamped and therefore the history of any object can be
replayed to produce the final result.

For example, if we set the key 'chilts' to be { name : 'Andy Chilton', age : 101 }, then put another attribute { feet :
2 }, followed by a delete of the 'age' attribute, the final object would be { name : 'Andy Chilton', feet : 2 }.

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
db.putAttrs('chilts', { email : 'andychilton@gmail.com' });

// get the item back out
db.getItem('chilts', function(err, item) {
    console.log(item); // gives { nick : 'chilts', name : 'Andy Chilton', email : 'andychilton@gmail.com' }
});
```

(Ends)
