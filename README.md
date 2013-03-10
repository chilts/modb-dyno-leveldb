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
db.putAttrs('chilts', { email : 'andychilton@gmail.com' });

// get the item back out
db.getItem('chilts', function(err, item) {
    // gives { nick : 'chilts', name : 'Andy Chilton', email : 'andychilton@gmail.com' }
    console.log(item);
});
```

(Ends)
