xplive.Common.shouldAskOnWindowClosing = false;
xplive.Widgets.SoundPlayer.isTestMode = true;
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

describe("ProgressBar Widget", function () {
	var bar;
	
	beforeEach(function () {
		bar = new xplive.Widgets.ProgressBar("", sOn.Testing.createFakeDocument());
		bar.initialize();
	});
	
	it("displays the percentage", function () {
		expect(bar.html()).toContain("0%");
		
		bar.update({remainingMinutes: 777, percent: 20});
		
		expect(bar.html()).toContain("20%");
		expect(bar.html()).toContain("777");
	});
	
	it("can be inactive", function () {
		bar.inactiveBar();
		
		expect(bar.html()).not.toContain("active");
	});	
	
	it("is active on start", function () {
		bar.inactiveBar();
		bar.start();
		
		expect(bar.html()).toContain("active");
	});		
	
	it("can remark a minute change", function () {
		bar.remarkMinuteChange();
		
		expect(bar.html()).toContain("minuteChange");
	});
});

   
describe("ExclusiveButtonToolbar", function(){
    var widget, fakeDocument;

    beforeEach(function() {
        fakeDocument = sOn.Testing.createFakeDocument();
    });

    it("deactivates everythingelse when one is activated", function(){
        widget = new xplive.Widgets.ExclusiveButtonToolbar(fakeDocument);
        widget.addButtons({
            'tasks': 'tasksTab',
            'pomodoros': 'pomodorosTab',
            'history': 'historyTab'
        });

        widget.activate('pomodoros');
        
        expect(widget.getButton('tasks').getCssClasses()).not.toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
        expect(widget.getButton('history').getCssClasses()).not.toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
        expect(widget.getButton('pomodoros').getCssClasses()).toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
    });
});

describe("ExclusivePanelList", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.ExclusivePanelList(fakeDocument);
        widget.addPanels({
            'tasks': 'tasksPanel_domId',
            'pomodoros': 'pomodorosPanel_domId'
        });
    });


    it("hides everythingelse when one is shown", function(){
        widget.show('pomodoros');
        
        expect(widget.getPanel('tasks').visible()).toBeFalsy();
        expect(widget.getPanel('pomodoros').visible()).toBeTruthy();
    });

    it("can show all but one", function(){
        widget.showAllBut('pomodoros');

        expect(widget.getPanel('tasks').visible()).toBeTruthy();
        expect(widget.getPanel('pomodoros').visible()).toBeFalsy();
    });
});

describe("UserActivityDetector", function(){
    var detector, eventBus;

    beforeEach(function(){
        sOn.Factory.ResetEventBus();
        eventBus = sOn.Factory.EventBus();
        detector = new xplive.Services.UserActivityDetector();
    });

    afterEach(function(){
        detector.reset();
    });

    it("notifies listener when user becomes inactive", function(){
        var spy = spyTheBus(xplive.Events.userIsNotInteractingWithWindow, eventBus);

        waitsFor(function(){
            detector.initialize(100); 
            return spy.called;
        }, "time out, idle detector is not working!", 200);
        runs(function(){
            expect(spy.called).toBeTruthy();
        });
    });

    it("notifies listener when user becomes active again", function(){
        var spyInactivity = spyTheBus(xplive.Events.userIsNotInteractingWithWindow, eventBus);
        var spyActivity = spyTheBus(xplive.Events.userIsActiveAgain, eventBus);
        waitsFor(function(){
            detector.initialize(200); 
            return spyInactivity.called;
        }, "1- time out, idle detector is not working!", 400
        );
        runs(function(){
            waitsFor(function(){
                 $('body').mousedown();
                 return spyActivity.called;
            }, "2- time out, idle detector is not working!", 400);
            runs(function(){
                expect(spyActivity.called).toBeTruthy();
            });            
        });
    });    
});

describe("Window close detector", function(){
    var detector;

    it("notifies listener when window is being closed", function(){
        var called = false;
        var listener = { onClosing: function(){ called = true}};
        detector = new xplive.Services.WindowCloseDetector();
        detector.initialize();
        detector.subscribe(listener);

        window.onbeforeunload();

        expect(called).toBeTruthy();
    });
});

describe("the sound player", function(){
    var player, fakeDocument;
    beforeEach(function(){
        xplive.Widgets.SoundPlayer.isTestMode = false;
    });

    it("renders the markup properly", function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        player = new xplive.Widgets.SoundPlayer('../meow', fakeDocument);

        player.initialize();
        
        expect(fakeDocument.html()).toContain('src="../meow.ogg"');
    });

    afterEach(function(){
        xplive.Widgets.SoundPlayer.isTestMode = true;
    });
});

describe("the way the factory assembles the app", function(){
    it("creates artifacts that communicate with the event bus", function(){
        var fakeDocument = sOn.Testing.createFakeDocument();
        var app = xplive.Factory.CreateApp({
                    tasksPlaceholder: fakeDocument,
                    tasksBinderId: "tasks",
                    finishedTasksBinderId: "finishedTasks",
                    pomodorosPlaceholder: fakeDocument
        });
        expect(app.activityDetector).toBeDefined();
        expect(app.teamCommunicator).toBeDefined();
        app.initialize();
    });
});

describe("the mates widget integration with DOM ", function(){
    var widget, fakeDocument, msg;

    it("creates the widget also before showing the message", function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.MatesWidget("testMatesWidget", fakeDocument);
        widget.initialize();
        msg = {id: 1, body: 'hello'};
        widget.showNewMessage("mate66", {body: 'yesyes'});

        expect(fakeDocument.html()).toContain('yesyes');        
    });
});


describe("the MatesWidget", function(){
    var widget, fakeDocument, msg;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.MatesWidget(fakeDocument);
        msg = {id: 1, body: 'hello'};
        widget.showPendingMessage('mate1', msg);
    });

    it('brings the widget to front when the header is clicked', function(){
        widget.showNewMessage('mate1', msg);
        spyOn(widget.membersDetailsWidgets["mate1"], "showNewMessage");

        widget.showNewMessage('mate1', msg);

        expect(widget.membersDetailsWidgets["mate1"].showNewMessage).
            toHaveBeenCalledWith(msg);
    });    

    it('shows the pending message', function(){
        spyOn(widget.membersDetailsWidgets["mate1"], "showPendingMessage");

        widget.showPendingMessage('mate1', msg);

        expect(widget.membersDetailsWidgets["mate1"].showPendingMessage).
            toHaveBeenCalledWith(msg);
    });        

    it('moves pending message to sent', function(){
        var msg = {id: 1, body: 'hello'};
        var msg2 = {id: 2, body: 'hello'};
        widget.showPendingMessage('mate1', msg);
        widget.showPendingMessage('mate1', msg2);

        spyOn(widget.membersDetailsWidgets["mate1"], "clearPendingMessages");
        spyOn(widget.membersDetailsWidgets["mate1"], "showPendingMessage");
        spyOn(widget.membersDetailsWidgets["mate1"], "showNewMessage");

        widget.moveMessageFromPendingToSent("mate1", msg);

        expect(widget.membersDetailsWidgets["mate1"].showPendingMessage).
            toHaveBeenCalledWith(msg2);
        expect(widget.membersDetailsWidgets["mate1"].clearPendingMessages).
            toHaveBeenCalled();
        expect(widget.membersDetailsWidgets["mate1"].showNewMessage).
            toHaveBeenCalledWith(msg);            
    });            

    it('clears pending messages', function(){
        spyOn(widget.membersDetailsWidgets["mate1"], "clearPendingMessages");

        widget.clearPendingMessages('mate1');

        expect(widget.membersDetailsWidgets["mate1"].clearPendingMessages).
            toHaveBeenCalled();
    });        

    it('pops up the new introduced message', function(){
        spyOn(widget, "onNewMessageIntroduced");

        widget.membersDetailsWidgets["mate1"].onNewMessageIntroduced('hello');

        expect(widget.onNewMessageIntroduced).
            toHaveBeenCalledWith("mate1", 'hello');
    });        
});

describe("TeamMate widget", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.TeamMate("id", fakeDocument, "test");
        widget.initialize();
    });

    describe("integration with DOM", function(){
        it("the chat input box", function(){
            var inputBox = new xplive.Widgets.ChatInputBox(
                                "wholeTeamChatInputTest", fakeDocument);
            inputBox.initialize();

            inputBox.setText("hello");
            expect(fakeDocument.html()).toContain("hello");
            spyOn(inputBox, "onMessageEntered");
            inputBox.onEnter();
            expect(fakeDocument.html()).not.toContain("hello");            
            expect(inputBox.focus).toBeDefined();
            expect(inputBox.onMessageEntered).toHaveBeenCalledWith('hello');
        });

        it("fires the event when the header is clicked", function(){
            spyOn(widget, "onHeaderClick");
            var header = fakeDocument.find("." + xplive.Widgets.TeamMate.headerCss);
            expect(header.length).toBe(1);

            header.click();

            expect(widget.onHeaderClick).toHaveBeenCalled();
        });
        it("fires the event when text is entered", function(){
            spyOn(widget, "onNewMessageIntroduced");

            widget.inputTextArea.onMessageEntered('hello');

            expect(widget.onNewMessageIntroduced).toHaveBeenCalledWith('hello');
            expect(widget.inputTextArea.text()).toBeFalsy();
        });
        it("renders the message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello'};
            widget.showNewMessage(msg);

            var txt = fakeDocument.html();
            expect(txt).toContain(msg.sender);
            expect(txt).toContain(msg.visibleReceiptTime);
            expect(txt).toContain(msg.body);
        });
        it("renders the pending message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello', id:1};

            widget.showPendingMessage(msg);

            var txt = fakeDocument.html();
            expect(txt).toContain(msg.sender);
            expect(txt).toContain(msg.visibleReceiptTime);
            expect(txt).toContain(msg.body);
        });

        it("clears the pending message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello', id:1};
                
            widget.showPendingMessage(msg);
            widget.clearPendingMessages();

            var txt = fakeDocument.html();
        });        
    });

    it("renders mate username and current task", function(){
        var userActivity = {username: "test"};
        widget.showMate();

        expect(widget.html()).toContain(userActivity.username);
        expect(widget.html()).toContain("closeBtn");
        expect(widget.visible()).toBeTruthy();
        var warning = fakeDocument.find("." + xplive.Widgets.TeamMate.pomodoroWarning);
        expect(warning.css("display")).toBe("none");
    });

    it("can change position randomly", function(){
        var top1 = widget.getNativeWidget().css('top');
        var left1 = widget.getNativeWidget().css('left');
        
        widget.changePositionRandomly();
        
        var top2 = widget.getNativeWidget().css('top');
        var left2 = widget.getNativeWidget().css('left');   
        expect(top1).not.toEqual(top2);
        expect(left1).not.toEqual(left2);
    });

    it("closes when close button is pressed", function(){
        var userActivity = {username: "test"};
        widget.showMate(userActivity);
        widget.closeBtn.doClick();

        expect(widget.visible()).toBeFalsy();
    });
});

describe("the status widget", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.StatusWidget({
            elementId: 'statusWidget',
            dropdown:'locationDropdown',
            placeholder: fakeDocument
        });
        widget.initialize();
    });

    it("populates dropdown with the default choices", function(){
        var html = fakeDocument.html().toUpperCase();
        expect(html).toContain(
            xplive.Common.Locations.IamNotHere.toUpperCase());
        expect($('#locationDropdown').html().toUpperCase()).toContain(
            xplive.Common.Locations.IamWorkingFromHome.toUpperCase());
    });

    it("pops up event when the status dropdown selection changes", function(){
        spyOn(widget, "onLocationChanged");

        widget.locationDropdown.onChange(xplive.Common.IamNotHere);

        expect(widget.onLocationChanged).toHaveBeenCalledWith(xplive.Common.IamNotHere);
    });
});
