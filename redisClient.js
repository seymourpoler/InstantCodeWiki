function redisWrap(redis){
  var self = {};
  
  self.retrieveObjectBy = function(key, fn){
     redis.get(key, function(err, target) {
       if (target)
           target = JSON.parse(target);
       else
           target = {};
       fn(target)
   });
  };

  self.storeObjectBy = function(key, obj){
    redis.set(key, JSON.stringify(obj));
  };

  self.appendTeamMessageToStore = function(msg){
       redis.get('teamMessages' + msg.team, function(err, teamMessages) {
           if (teamMessages){
              teamMessages = JSON.parse(teamMessages);
           }
           else {
              teamMessages = [];
           }
           teamMessages.push(msg);
           redis.set('teamMessages' + msg.team, JSON.stringify(teamMessages));
       });
  };

  self.appendLinkToStore = function(link, done){
       redis.get('sharedLinks' + link.team, function(err, links) {
           if (links){
              links = JSON.parse(links);
           }
           else {
              links = [];
           }
           links.push(link);
           redis.set('sharedLinks' + link.team, JSON.stringify(links));
           if (typeof(done) == 'function'){
               done();
           };
       });
  };

  self.retrieveSharedLinks = function(fn, team){
      redis.get('sharedLinks' + team, function(err, links){
          fn(links);
      });
  };

  self.retrieveStoredTeamMessages = function(fn, team){
       redis.get('teamMessages' + team, function(err, teamMessages) {
          fn(teamMessages);
       });
  }

  return self;
};

module.exports = redisWrap;

