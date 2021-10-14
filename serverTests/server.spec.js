var context = describe;
var redis = require('redis-url').connect();
var redisWrap = require('../redisClient');

describe("the server side", function(){
  var client = redisWrap(redis);

  describe("users redis to store data", function(){
      it("stores and retrieves messages for a given team", function(){

      });
  });

});

