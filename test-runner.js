// ----------------------------------------------------------------------------
//
// test-runner.js - run all the dyno-abstract tests
//
// Copyright (c) 2013 Andrew Chilton
//
// * andychilton@gmail.com
// * http://chilts.org/
//
// ----------------------------------------------------------------------------

var dyno = require('./dyno-leveldb.js');

function newDyno() {
    return dyno('/tmp/' + (new Date()).toISOString());
};

// ok, pass this function to the tests
var tests = require('dyno-abstract/tests.js');
tests(newDyno);

// ----------------------------------------------------------------------------
