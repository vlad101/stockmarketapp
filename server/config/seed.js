/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Thing = require('../api/thing/thing.model');

// Populate the database with the companies
Thing.find({}).remove(function() {
  Thing.create({
    name : 'MSFT'
  }, {
    name : 'GOOG'
  }, {
    name : 'AAPL'
  });
});