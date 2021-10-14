xplive.Common.shouldAskOnWindowClosing = false;
//xplive.Widgets.SoundPlayer.isTestMode = true;
var Duration = xplive.Common.Duration;

var spyTheBus = function(evtName, eventBus){
    var Spy = function(){
        this.called = false;
        this.callCount = 0;
        var self = this;
        this.subs = function(evtN, evargs){
            if (evtN == evtName){
                self.callCount++;
                self.called = true;
                self.eventArgs = evargs;
            }
        };
    };
    var spy = new Spy();
    eventBus.addSubscriber(spy.subs, evtName);
    return spy;
};

describe("Session", function(){
    var manager;
    beforeEach(function(){
        manager = new xplive.SessionManager();
        manager.locationGetter.path = function(){ return "/team/test"};
    });

    it("can get username and team from current location", function(){
        var session = manager.browserSession();
        expect(session.username).toBe("test");
        expect(session.team).toBe("team");
    });
    it("decodes uri and clean spaces", function(){
        manager.locationGetter.path = function(){ return "/team/%20té"};
        var session = manager.browserSession();
        expect(session.username).toBe("té");
        expect(session.team).toBe("team");
    });    
    it("lowers the case for the username", function(){
        manager.locationGetter.path = function(){ return "/Team/Test"};
        var session = manager.browserSession();
        expect(session.username).toBe("test");
        expect(session.team).toBe("team");
    });        
    it("creates a random session id", function(){
        var session = manager.browserSession();
        expect(session.sid).toBeDefined();
        expect(session.sid.length).toBeGreaterThan(2);
        expect(session.sid).not.toEqual(manager.browserSession().sid);
    });
});

describe("the shared code widget", function(){
    var widget;

});

describe("the team communicator", function(){
    var communicator, session, chatProxy, 
        wholeTeamChatInput, message, 
        receiptTime, roster,
        codeWidget, notifier;

    beforeEach(function(){
        var markup = '<div id="linksContainer"><input type="text" id="linkDesc"/><input type="tex" id="linkUrl"/><button id="linkSubmit">share</button><div id="sharedLinks"></div></div>';
        $('body').append(markup); 
        instantiate();
        initReferences();
        stubOutAllDependencies();     
        communicator.initialize();
        initFixtures();
    });

    afterEach(function(){
        $('#linksContainer').remove();
    });

    function instantiate(){
        session = {username: "mate1", team: "team1", host: "host"};
        communicator = xplive.Factory.createTeamCommunicator({}, session);
        sOn.Factory.ResetEventBus();
    }
    function initFixtures(){
        var msgBody = "hello";
        assumeThatUserIntroducedTextInBox(msgBody);
        message = {receiver: xplive.Common.Team,
                   body: msgBody,
                   sender: session.username};
    }
    function initReferences(){
        chatProxy = communicator.get.chatProxy;
        wholeTeamChatInput = communicator.get.wholeTeamChatInput;
        notifier = communicator.get.notifier;
        roster = communicator.get.roster;
        wholeTeamChatViewer = communicator.get.wholeTeamChatViewer;
        codeWidget = communicator.get.codeWidget;
    }

    function assumeThatUserIntroducedTextInBox(text){
        communicator.get.codeWidget.text = function(){ return text;};
    }

    function stubOutAllDependencies(){
        receiptTime = new Date(2013,1,1, 10, 30, 0);
        communicator.get.clock.giveMeTheTime = function(){
            return receiptTime;
        };
        spyOn(roster, "showNewMessage");
        spyOn(roster, "moveMessageFromPendingToSent");
        spyOn(roster, "showPendingMessage");
        spyOn(chatProxy, "sendMessageToTeam");
        spyOn(chatProxy, "sendMessage");
        spyOn(chatProxy, "confirmReception");
        spyOn(codeWidget, "showMessage");
    }

    function assertThatMethod(method){
        return {
            wasInvoked: function(){
                expect(method).toHaveBeenCalled();
            },
            wasInvokedWith: function(msg){
                this.wasInvoked();
                var actualArg = method.mostRecentCall.args[0];
                expect(msg.receiver).toEqual(actualArg.receiver);
                expect(msg.sender).toEqual(actualArg.sender);
                expect(msg.body).toEqual(actualArg.body);
            },
            wasInvokedWithArgs: function(mate, msg){
                this.wasInvoked();
                var actualMate = method.mostRecentCall.args[0];
                var actualMsg = method.mostRecentCall.args[1];
                expect(actualMate).toEqual(mate);
                expect(actualMsg.body).toEqual(msg.body);
            },
            wasInvokedWithReceiver: function(receiver){
                this.wasInvoked();
                var actualArg = method.mostRecentCall.args[0];
                expect(actualArg.receiver).toEqual(receiver);
            }
        };
    }

    it("receives the team chat messages to display them in the widget", function(){
        chatProxy.onWholeTeamMessage({
            sender: 'john', body: 'morning'});

        expect(codeWidget.showMessage).toHaveBeenCalled();
    }); 

    it("draws all shared links", function(){
        chatProxy.onLinksLoaded([{description: 'desc', url: 'http://test123'}]);

        expect($('body').html()).toContain('http://test123');
    });


    it("sends the shared code through the proxy", function(){
        codeWidget.onMessageEntered(message);

        assertThatMethod(chatProxy.sendMessageToTeam).wasInvoked();
    });

    it("sends the messages through the chat proxy", function(){
        communicator.sendMessage("hello").to('john');

        assertThatMethod(chatProxy.sendMessage).wasInvokedWithReceiver('john');
    });

    it("receives the messages to display them in the widget", function(){
        chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        assertThatMethod(roster.showNewMessage).
            wasInvokedWithArgs('john', {
                body: 'morning'
        });
    });
 
    it("draws the sent message in the widget", function(){
        communicator.sendMessage("hello").to('john');

        assertThatMethod(roster.showNewMessage).
            wasInvokedWithArgs('john', {
                body: 'hello'
        });

    });

    it("moves the message from pending to sent", function(){
        chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas'});

        assertThatMethod(roster.moveMessageFromPendingToSent).
            wasInvokedWithArgs('lucas', {body: 'morning'});
    });    

    it("moves the message from pending to sent only if it is not repeated", function(){
        chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas', id:1});

        chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas', id:1});

        expect(roster.moveMessageFromPendingToSent.callCount).toBe(1);
    });        

    it("confirms the reception of a new message", function(){
        var msg = {sender: 'john', body: 'morning'};
        
        chatProxy.onReceivedMessage(msg);

        assertThatMethod(chatProxy.confirmReception).
            wasInvokedWith(msg);
    });    

    it("notifies user when message arrives and window is not visible", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsNotVisible);
        spyOn(notifier, 'notifyUser');

        chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(notifier.notifyUser).toHaveBeenCalled();
    });    

    it("does not notify user when window is visible and message arrives", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        spyOn(notifier, "notifyUser");

        chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(notifier.notifyUser).not.toHaveBeenCalled();
    });        

    it("notifies user if inactive on message arrival", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
        spyOn(notifier, "notifyUser");

        chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(notifier.notifyUser).toHaveBeenCalled();
    });            

    it("dimisses notification when user comes back to the app", function(){
        spyOn(notifier, "dismissNotification");

        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        
        expect(notifier.dismissNotification).toHaveBeenCalled();
    });            

    it("sends the message through the proxy when is introduced in the widget", function(){
        roster.onNewMessageIntroduced('john', 'hello');

        expect(chatProxy.sendMessage).toHaveBeenCalled();
    });

    it("draws the new introduced message", function(){
        roster.onNewMessageIntroduced('john', 'hello');

        assertThatMethod(roster.showPendingMessage)
            .wasInvokedWithArgs('john', {body: '<pre>hello</pre>'});
    });
});



describe("the configuration", function(){
    it("has values that make sense", function(){
        expect(xplive.Common.MaximunMissingMateUpdatesToConsiderOffline
                ).toBeGreaterThan(xplive.Common.ActivityIsSentAtLeast);
    });
});


describe("the button factory", function(){
    it("can create buttons for users containg the @ symbol", function(){
        var container = new sOn.Widgets.Panel("testPanel");
        container.initialize();
        var btn = new xplive.Widgets.ButtonFactory().createButton("@carlosble", container);
        btn.initialize();
        expect(btn.html()).not.toContain("@");
    });

});

describe("the shared links widget", function(){
    var markup = '<div id="linksContainer"><input type="text" id="desc"/><input type="tex" id="url"/><button id="shareLink">share</button><div id="sharedContent"></div></div>';
    var widget;
    
    beforeEach(function(){
        $('body').append(markup);
        widget = xplive.Widgets.createSharedLinksWidget(
                  $("#desc"), $("#url"), $("#shareLink"), $("#sharedContent"));
        $('#desc').val('test');
        $('#url').val('testxxx');
    });

    afterEach(function(){
        $('#linksContainer').remove();
    });

    it("adds link to the shared links", function(){
        $('#shareLink').click();
        expect($('#sharedContent').length).toBeGreaterThan(0);
        expect($('#desc').val()).toBeFalsy();
        expect($('#sharedContent').html()).toContain(
               '<a href="http://testxxx">test</a>');
    });
    it("adds link using the url as description if empty", function(){
        $('#desc').val("");
        $('#shareLink').click();
        expect($('#sharedContent').length).toBeGreaterThan(0);
        expect($('#sharedContent').html()).toContain(
               '<a href="http://testxxx">testxxx</a>');
    });
    it("doesnt add the same link twice to shared links", function(){
        $('#shareLink').click();
        $('#desc').val('test');
        $('#url').val('testxxx');
        $('#shareLink').click();
        expect($('#sharedContent').find('a').length).toEqual(1);
    });
    it("fires event when link is added", function(){
        var fired = false;
        widget.onLinkAdded(function(){
            fired = true;
        });
    
        $('#shareLink').click();

        expect(fired).toBeTruthy();
    });
});

