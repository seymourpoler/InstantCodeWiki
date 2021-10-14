casper.test.begin("The connected users' roster", 6, function suite(test) {
    var team = "superduperteam";
    var user1 = "Bob77";
    var user2 = "Joe99";
    var teamViewerSelector = "#teamViewer";
    var selectorOfaUserInTheRoster = "a span";
    var siteTitle = "Instant Code Wiki";

    casper.start('http://localhost:3000/' + team + "/" + user1 , function() {
        test.assertTitle(siteTitle + " | " + team);
    });

    casper.then(function displaysNameOfLoggedUser(){
        test.assertTextExists(user1);
    });

    casper.waitFor(userToBeVisibleInRosterWithTheName(user1),
        function then(){
            test.assertSelectorHasText(selectorOfaUserInTheRoster, 
                                   user1.toLowerCase()); 
    });

    casper.thenOpen('http://localhost:3000/' + team + "/" + user2 , function() {
        test.assertTitle(siteTitle + " | " + team);
    });

    casper.waitFor(userToBeVisibleInRosterWithTheName(user2), function then(){
        test.assertSelectorHasText(selectorOfaUserInTheRoster, 
                                   user2.toLowerCase()); 
        test.assertSelectorDoesntHaveText(selectorOfaUserInTheRoster, 
                                   user1.toLowerCase()); 
    });

    function userToBeVisibleInRosterWithTheName(username){
        return function(){
           return this.evaluate(function(usern, selector){
              return $(selector).html().toLowerCase().indexOf(
                                       usern.toLowerCase()) > 0;
           }, username, teamViewerSelector);
        };
    };

    casper.run(function(){ 
        test.done();
    });
});


