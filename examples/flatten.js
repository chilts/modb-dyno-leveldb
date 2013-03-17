// use level-dyno and open a new datastore
var dyno = require('../level-dyno.js');
var flake = require('flake')('eth0');

// open a new database
var db = dyno('/tmp/users');

// get the item back out
db.getItem('chilts', function(err, item, meta) {
    // gives { nick : 'chilts', name : 'Andy Chilton', email : 'andychilton@gmail.com' }
    console.log('There have been ' + meta.changes + ' changes to this item');
    console.log('The last change occurred at ' + meta.timestamp);
    console.log('The hash for these changes are ' + meta.hash);
    console.log('Item: ', item);

    // now, flatten it
    db.flatten('chilts', meta.hash, function(err) {
        console.log('Item has been flattened');

        db.getItem('chilts', function(err, item, meta) {
            // gives { nick : 'chilts', name : 'Andy Chilton', email : 'andychilton@gmail.com' }
            console.log('There have been ' + meta.changes + ' changes to this item');
            console.log('The last change occurred at ' + meta.timestamp);
            console.log('The hash for these changes are ' + meta.hash);
            console.log('Item: ', item);
        });
    });
});
