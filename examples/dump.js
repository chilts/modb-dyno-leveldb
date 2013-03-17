// ----------------------------------------------------------------------------

var levelup = require('levelup');

// ----------------------------------------------------------------------------

var db = levelup('/tmp/users');

db.readStream()
    .on('data', function(data) {
        console.log('' + data.key + ' = ' + data.value);
    })
    .on('error', function(err) {
        console.warn('Error: ', err);
        process.exit(2);
    })
    .on('close', function() {
        console.log('Closed');
    })
    .on('end', function(err) {
        console.log('Ended');
    })
;

// ----------------------------------------------------------------------------
