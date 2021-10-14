var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var redisWrap = require('../redisClient');
var expect = require('chai').expect;

describe("the redis wrapper", function(){
   var redisClient = redisWrap(redis);
  
   beforeEach(function(done){
      redisClient.appendLinkToStore({'team': 'test', 
                          'description': 'desc', 'url': 'http://'}, done);
   });

   it("can store and retrieve shared links", function(done){
       var links = redisClient.retrieveSharedLinks(function(links){
          expect(links).to.be.ok;
          var links = JSON.parse(links);
          expect(links[0].description).to.eql('desc');
          done();
       },'test'); 
   });

});

