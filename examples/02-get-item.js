// use dyno-leveldb and open a new datastore
var dyno = require('../dyno-leveldb.js');

// open a new database
var db = dyno('/tmp/users');

// get the item back out
db.getItem('chilts', function(err, item, meta) {
    // gives { nick : 'chilts', name : 'Andy Chilton', email : 'andychilton@gmail.com' }
    console.log('There have been ' + meta.changes + ' changes to this item');
    console.log('The last change occurred at ' + meta.timestamp);
    console.log('The hash for these changes are ' + meta.hash);
    console.log('Item: ', item);
});
