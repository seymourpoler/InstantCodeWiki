casper.test.begin("Sharing links end2end", 1, function suite(test) {
    var team = "superduperteam";
    var user1 = "Bob77";
    var user2 = "Joe99";
    var teamViewerSelector = "#teamViewer";
    var selectorOfaUserInTheRoster = "a span";
    var urlDescription = "IRRELEVANTMESSAGE";
    var url = "http://irrelevanturl";

    casper.start('http://localhost:3000/' + team + "/" + user1);

    casper.thenEvaluate(function(urlDescription, url){
       xplive.App.shareLink(urlDescription, url);
    }, urlDescription, url);

    casper.waitFor(function (){
        return this.evaluate(function(urlDescription){
               return $('#sharedLinks').html().indexOf(urlDescription) > 0;
        }, urlDescription);
    }, function then(){
           // TODO: assert that link exists, not just text
           test.assertTextExists(urlDescription);
    });
    
    casper.run(function(){ 
        test.done();
    });
});

