casper.test.begin("How connected users welcome the new user", 1, function suite(test) {
    var team = "superduperteam";
    var user1 = "Bob77";
    var user2 = "Joe99";
    var teamViewerSelector = "#teamViewer";
    var selectorOfaUserInTheRoster = "a span";
    var doneUser1 = false, doneUser2 = false;
    var otherBrowser = require('casper').create({
            logLevel: 'info',
//            verbose: true,
    });

    casper.start('http://localhost:3000/' + team + "/" + user1, function() {
        test.assertTitle("Instant Code Wiki | " + team);
    });
    casper.waitFor(userToBeVisibleInRosterWithTheName(user1), function then(){
      otherBrowser.start('http://localhost:3000/' + team + "/" + user2);
      otherBrowser.waitFor(userToBeVisibleInRosterWithTheName(user2), function then(){
            otherBrowser.test.assertSelectorHasText(selectorOfaUserInTheRoster, 
                                   user1.toLowerCase()); 
      });
      otherBrowser.run(function(){
           doneUser2 = true;
           if (doneUser1){
              test.done();
           }
      });
    });
    casper.run(function(){ 
        doneUser1 = true;
        if (doneUser2)
           test.done();
    });
    
    function userToBeVisibleInRosterWithTheName(username){
        return function(){
           return this.evaluate(function(usern, selector){
              return $(selector).html().toLowerCase().indexOf(
                                       usern.toLowerCase()) > 0;
           }, username, teamViewerSelector);
        };
    };

});


