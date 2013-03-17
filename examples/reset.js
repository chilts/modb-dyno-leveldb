// ----------------------------------------------------------------------------

var levelup = require('levelup');

// ----------------------------------------------------------------------------

var db = levelup('/tmp/users');

console.log('Deleting all keys');

db.keyStream()
    .on('data', function(key) {
        console.log('Deleting ' + key);
        db.del(key);
    })
    .on('error', function(err) {
        console.warn('Error: ', err);
        process.exit(2);
    })
    .on('end', function(err) {
        console.log('Done');
    })
    .on('close', function() {
        console.log('Closed');
    })
;

// ----------------------------------------------------------------------------
