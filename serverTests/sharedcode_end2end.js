casper.test.begin("Sharing code end2end", 3, function suite(test) {
    var team = "superduperteam";
    var user1 = "Bob77";
    var user2 = "Joe99";
    var teamViewerSelector = "#teamViewer";
    var selectorOfaUserInTheRoster = "a span";
    var testMessage = "IRRELEVANTMESSAGE";
    var siteTitle = "Instant Code Wiki";

    casper.start('http://localhost:3000/' + team + "/" + user1 , function() {
        test.assertTitle(siteTitle + " | " + team);
    });

    casper.thenEvaluate(function(team, msgBody, user){
        var proxy = new xplive.Chat.ChatProxy({'team': team, 'username': user});
        proxy.connect();
        proxy.sendMessageToTeam({'team': team, 'body': msgBody});
    }, team, testMessage, user1);

    casper.thenOpen('http://localhost:3000/' + team + "/" + user2 , function() {
        test.assertTitle(siteTitle + " | " + team);
    });

    casper.waitFor(function (){
        return this.evaluate(function(testMsg){
               return $('body').html().indexOf(testMsg) > 0;
        }, testMessage);
    }, function then(){
           test.assertTextExists(testMessage);
    });

    casper.run(function(){ 
        test.done();
    });
});


