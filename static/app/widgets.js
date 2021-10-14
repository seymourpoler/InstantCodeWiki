xplive.Widgets = xplive.Widgets || {};

xplive.Widgets.WindowManager = function () {
    var animationTime = 700;
    var animationStopOffset = 1200;
    var maximunAnimationFrames = 500;
    var runAnimation = false;
    var originalTitle = null;

	this.changeTitle = function (title) {
		window.document.title = title;
	};

    var animate = function(blinkingTitle, iteration){
        if (!iteration || !runAnimation)
            return;
        iteration--;
        var current = window.document.title;
        setTimeout(function(){
            if (runAnimation){
                window.document.title = blinkingTitle;
                animate(current, iteration);
            }
        }, animationTime);
    };

    this.animateTitle = function(blinkingTitle){
        runAnimation = true;
        originalTitle = window.document.title;
        animate(blinkingTitle, maximunAnimationFrames);
    };

    this.stopTitleAnimation = function(){
        runAnimation = false;
        if (originalTitle){
            setTimeout(function(){
                window.document.title = xplive.AppName;
            }, animationStopOffset);
        }
    };

    var thereIsAlreadyVisibleDialog = false;

    this.closeCurrentNotification = function(){
        if (this.currentNotification){
            this.currentNotification.close();
            this.currentNotification.cancel();
            this.currentNotification = null;
        }
    };

    this.popUpNotification = function(title, msg){
        try{
            if (thereIsAlreadyVisibleDialog)
                return;
            var notification = window.webkitNotifications.createNotification(
                    '', title, msg);
            notification.onclick = function(){
                window.focus();
                this.cancel();
                thereIsAlreadyVisibleDialog = false;
            };
            notification.onclose = function(){
                this.cancel();
                thereIsAlreadyVisibleDialog = false;
            };
            notification.show();
            thereIsAlreadyVisibleDialog = true;
            this.currentNotification = notification;
        }
        catch(e){
            sOn.Logger.logException(e);
        }
    };
};
///////////////////////

xplive.Widgets.SourceCodeEditor = function(nativeWidget){
    nativeWidget = nativeWidget || $('<div>');
    this.showMessage = function(msg){
        nativeWidget.navigateFileEnd();
        nativeWidget.insert("//----------" + msg.visibleReceiptTime + "\n");
        nativeWidget.insert("//---------- Posted by: " + msg.sender + "\n\n");
        nativeWidget.insert(msg.body);
    };

};


xplive.Widgets.ChatConversationViewer = function(nativeWidget){
    nativeWidget = nativeWidget || $('<div>');
    this.showMessage = function(msg){
        var txt = '<div class="' + xplive.Widgets.TeamMate.wholeMessage + '">';
        txt += '<span class="' + xplive.Widgets.TeamMate.msgInfo + '">';
        txt += msg.visibleReceiptTime + '</span>';
        txt += ' <span class="' + xplive.Widgets.TeamMate.msgSender +'">';
        txt += msg.sender + '</span>: ';
        txt += '<span class="' + xplive.Widgets.TeamMate.msgBody + '">';
        txt += msg.body;
        txt += '</span>';
        txt += '</div>';
        nativeWidget.append(txt);
        nativeWidget.scrollTop(
            20 + nativeWidget.height() + nativeWidget[0].scrollHeight + nativeWidget.offset().top);
    };
};

xplive.Widgets.ChatInputBox = function(elementId, placeholder){
    sOn.Widgets.TextArea.call(this, elementId, placeholder);
};

xplive.Widgets.ChatInputBox.prototype = new sOn.Widgets.TextArea();
xplive.Widgets.ChatInputBox.prototype.setText = function(text){
    sOn.Widgets.TextArea.prototype.setText.call(this, text);
    this.getNativeWidget().text(text);
};
xplive.Widgets.ChatInputBox.prototype._initializeDomElement = function(){
    sOn.Widgets.TextArea.prototype._initializeDomElement.call(this);
    this.onEnter = function(){
        var text = this.text();
        if (text != "\n" && text != '\r')
            this.onMessageEntered(text);
        this.setText("");
    };
};

xplive.Widgets.ChatInputBox.prototype.onMessageEntered = function(){}; // event

/////////////////////////////

xplive.Widgets.TeamMate = function(elementId, placeholder, mateName){
    sOn.Widgets.Widget.call(this, elementId, placeholder);
    this.mateName = mateName;
};
xplive.Widgets.TeamMate.modalCss = "modal hide fade in";
xplive.Widgets.TeamMate.headerCss = "modal-header";
xplive.Widgets.TeamMate.bodyCss = "modal-body";
xplive.Widgets.TeamMate.pendingCss = "modal-pending";
xplive.Widgets.TeamMate.footerCss = "modal-footer";
xplive.Widgets.TeamMate.inputCss = "chat_textarea";
xplive.Widgets.TeamMate.msgInfo = "chat_msginfo";
xplive.Widgets.TeamMate.msgSender = "chat_msgsender";
xplive.Widgets.TeamMate.chatLabelCss = "chat_label";
xplive.Widgets.TeamMate.msgBody = 'chat_msgbody';
xplive.Widgets.TeamMate.wholeMessage = "chat_wholemsg";
xplive.Widgets.TeamMate.pomodoroWarning = "chat_pomodoro_warning";

xplive.Widgets.TeamMate.prototype = new sOn.Widgets.Widget();

xplive.Widgets.TeamMate.prototype.onHeaderClick = function(){}; // event

xplive.Widgets.TeamMate.prototype.bringToFront = function(zindex){
    this.getNativeWidget().css('z-index', zindex);
};

xplive.Widgets.TeamMate.prototype._createDomElement = function () {
    var nativeWidget = $('<div>', { id: this.elementId });
    nativeWidget.addClass(xplive.Widgets.TeamMate.modalCss);
    this.header = $('<div>');
    var header = this.header;
    var self = this;
    this.header.addClass(xplive.Widgets.TeamMate.headerCss);
    this.header.appendTo(nativeWidget);
    this.closeBtn = new sOn.Widgets.Button("closeBtn" + this.mateName, 
                        this.header, "X", sOn.Widgets.Button.types.close);
    this.headerText = $('<h3>');
    this.subHeaderText = $('<p>');
    this.chatLabel = $('<div>');
    this.chatLabel.text("Conversation:");
    this.chatLabel.addClass(xplive.Widgets.TeamMate.chatLabelCss);
    this.chatLabel.appendTo(nativeWidget);
    this.body = $('<div>');
    this.body.addClass(xplive.Widgets.TeamMate.bodyCss);
    this.body.appendTo(nativeWidget);
    this.chatViewer = new xplive.Widgets.ChatConversationViewer(this.body);
    this.pendingMessagesLabel = $('<div>');
    this.pendingMessagesLabel.text("Not delivered yet:");
    this.pendingMessagesLabel.addClass(xplive.Widgets.TeamMate.chatLabelCss);
    this.pendingMessagesLabel.appendTo(nativeWidget);
    this.pendingMessages = $('<div>');
    this.pendingMessages.addClass(xplive.Widgets.TeamMate.pendingCss);
    this.pendingMessages.appendTo(nativeWidget);
    this.pendingMessagesViewer = new xplive.Widgets.ChatConversationViewer(
                        this.pendingMessages);
    this.pomodoroWarningMessage = "Remember: chat messages will be displayed to her/him as the pomodoro finishes.";
    this.pomodoroWarning = $('<div>');
    this.pomodoroWarning.html(this.pomodoroWarningMessage);
    this.pomodoroWarning.addClass(xplive.Widgets.TeamMate.pomodoroWarning);
    this.pomodoroWarning.appendTo(nativeWidget);
    this.pomodoroWarning.hide();
    this.inputTextPlaceholder = $('<div>');
    this.inputTextPlaceholder.appendTo(nativeWidget);
    this.inputTextArea = new xplive.Widgets.ChatInputBox("textInput" + this.mateName,
        this.inputTextPlaceholder);

    var footer = $('<div>');
    footer.addClass(xplive.Widgets.TeamMate.footerCss);
    footer.appendTo(nativeWidget);
    footer.click(function(){
        self.onHeaderClick(self);
    });
    this.header.click(function(){
        self.onHeaderClick(self);
    });
    nativeWidget.appendTo(this.placeholder);
    this.registerNativeWidget(nativeWidget);
};

xplive.Widgets.TeamMate.prototype.onNewMessageIntroduced = function(){}; // event

xplive.Widgets.TeamMate.prototype._initializeDomElement = function(){
    this.closeBtn.initialize();
    var nondrag = '.' + xplive.Widgets.TeamMate.bodyCss + ",." + xplive.Widgets.TeamMate.pendingCss + ", textarea";
    this.getNativeWidget().draggable({cancel: nondrag });
    this.headerText.appendTo(this.header);
    this.subHeaderText.appendTo(this.header);
    var self = this;
    this.closeBtn.onClick = function(){
        self.hide();
    };
    this.body.click(function(){
        self.onHeaderClick(self);
    });
    this.pendingMessages.click(function(){
        self.onHeaderClick(self);
    });
    
    this.inputTextArea.initialize();
    this.inputTextArea.addClass(xplive.Widgets.TeamMate.inputCss);
    this.inputTextArea.onMessageEntered = function(text){
         self.onNewMessageIntroduced(text);
    };
    this.inputTextArea.getNativeWidget().click(function(){
        self.onHeaderClick(self);
    });
};
xplive.Widgets.TeamMate.prototype.updateMateActivity = function(mateActivity){
    if (mateActivity){
        this.headerText.text(mateActivity.username);
        this.subHeaderText.html(mateActivity.otherInfo);
    }
};

xplive.Widgets.TeamMate.prototype._randomTopPosition = function(){
    var height = this.getNativeWidget().height() - 200;
    return Math.ceil(Math.random() * 200) +  height;
};
xplive.Widgets.TeamMate.prototype._randomLeftPosition = function(){
    var left = this.getNativeWidget().width() / 2;
    return Math.ceil(Math.random() * left) + left;
};

xplive.Widgets.TeamMate.prototype.changePositionRandomly = function(){
    try{
       this.getNativeWidget().css('top', this._randomTopPosition());
       this.getNativeWidget().css('left', this._randomLeftPosition());
    }
    catch(e){
        sOn.Logger.logException(e);
    }
};

xplive.Widgets.TeamMate.prototype._showMessage = function(msg, widget){
    widget.showMessage(msg);
    this.show();
};

xplive.Widgets.TeamMate.prototype.focusOnInput = function(){
    this.inputTextArea.focus();
};

xplive.Widgets.TeamMate.prototype.showPendingMessage = function(msg){
    this._showMessage(msg, this.pendingMessagesViewer);
};

xplive.Widgets.TeamMate.prototype.clearPendingMessages = function(){
    this.pendingMessages.html("");
};

xplive.Widgets.TeamMate.prototype.showNewMessage = function(msg){
    this._showMessage(msg, this.chatViewer);
};

xplive.Widgets.TeamMate.prototype.showMate = function(){
    this.show();
};

///////////////////////

xplive.Widgets.Roster = function(elementId, placeholder){
    var self = this;
    this.placeholder = placeholder || $('body');
    this.membersDetailsWidgets = {length: 0};
    var pendingMessages = {};
    this.frontWidgetZindex = 10;
    this.memberButtonsBar = new xplive.Widgets.MemberButtonsBar(elementId);
    var lastActivityReceived = null;

    this.initialize = function(){
        this.memberButtonsBar.initialize();
        this.memberButtonsBar.onMemberButtonClicked = function(username){
            self.showMateInfo(username);
        };
    };

    this.show = function(){
        this.memberButtonsBar.show();
    };    

    this.html = function(){
        return this.memberButtonsBar.html();
    };

    this.buttonFor = function(username){
        return this.memberButtonsBar.buttonFor(username);
    };

    this.updateActivity = function(activity){
        lastActivityReceived = activity;
        self.memberButtonsBar.updateButton(activity.username, activity);
        createMateWidgetTheFirstTime(activity.username);
        self.membersDetailsWidgets[activity.username].updateMateActivity(activity);
    };

    var createMateWidgetTheFirstTime = function(username){
        pendingMessages[username] = {};
        var mateWidget = self.membersDetailsWidgets[username];
        if  (!mateWidget){
            var randomId =  xplive.Widgets.safeElementIdBasedOn(username);
            mateWidget = new xplive.Widgets.TeamMate("msg" + randomId,
                self.placeholder, username);
            mateWidget.initialize();
            mateWidget.onHeaderClick = function(){
                self.frontWidgetZindex++;
                this.bringToFront(self.frontWidgetZindex);
            };
            mateWidget.onNewMessageIntroduced = function(msg){
                self.onNewMessageIntroduced(username, msg);
            };
            mateWidget.changePositionRandomly();
            self.membersDetailsWidgets.length = self.membersDetailsWidgets.length +1;
            self.membersDetailsWidgets[username] = mateWidget;
        }
    };

    this.showNewMessage = function(sender, msg){
        createMateWidgetTheFirstTime(sender);
        self.membersDetailsWidgets[sender].showNewMessage(msg);
    };

    this.showPendingMessage = function(sender, msg){
        createMateWidgetTheFirstTime(sender);
        pendingMessages[sender][msg.id]  = msg;
        self.membersDetailsWidgets[sender].showPendingMessage(msg);
    };

    this.clearPendingMessages = function(sender){
        createMateWidgetTheFirstTime(sender);
        self.membersDetailsWidgets[sender].clearPendingMessages();
    };

    this.moveMessageFromPendingToSent = function(sender, msg){
        var widget = self.membersDetailsWidgets[sender];
        widget.clearPendingMessages();
        widget.showNewMessage(msg);
        delete pendingMessages[sender][msg.id];
        for (var i in pendingMessages[sender])
            widget.showPendingMessage(pendingMessages[sender][i]);
    };

    this.showMateInfo = function(username){
        createMateWidgetTheFirstTime(username);
        this.frontWidgetZindex++;
        self.membersDetailsWidgets[username].showMate();
        self.membersDetailsWidgets[username].bringToFront(this.frontWidgetZindex);
        self.membersDetailsWidgets[username].focusOnInput();
    };

    this.onNewMessageIntroduced = function(){};
};

//////////////////////

xplive.Widgets.ButtonFactory = function(){
    this.createButton = function(username, container){
        var btn = new sOn.Widgets.Button(
                    xplive.Widgets.safeElementIdBasedOn(username), 
                    container.getNativeWidget(), "", null);
       btn.initialize();
       return btn;
    };
};

xplive.Widgets.safeElementIdBasedOn  = function(username){
    return username.replace(/@/g, "") + sOn.Widgets.getRandomId();
};

xplive.Widgets.MemberButtonConfigurator = function(){
    var decideCssBasedOnActivity = function(memberActivity){
        var css = "";
        if (memberActivity.itsMe)
            css = xplive.Styles.memberIsMyself + ' ';
        if (memberActivity.isApparentlyOffline)
            return css + xplive.Styles.memberOffline + ' ' + xplive.Styles.disabled;
        if (memberActivity.isTakingBreak)
            return css + xplive.Styles.memberIsTakingBreak;
        return css + xplive.Styles.memberAvailable;
    };

    var setCssIfHasChanged = function(btn, cssClass){
        if (btn.getCssClasses() != cssClass){
            btn.removeClass();
            btn.addClass(cssClass);
        }
    };

    this.showMemberStatusInButton = function(btn, memberActivity, username){
        var cssClass = decideCssBasedOnActivity(memberActivity);
        setCssIfHasChanged(btn, cssClass);
        btn.getNativeWidget().attr("title", memberActivity.username);
        var caption = '<span class="bigMateMonitorInfo">';
        caption += memberActivity.username + "</span></br>";
        //caption += '<span class="smallMateMonitorInfo">';
        //caption += memberActivity.otherInfo + '</span>';
        btn.getNativeWidget().html(caption);
    };
};

xplive.Widgets.MemberButtonsBar = function(elementId, placeholder){
    sOn.Widgets.Panel.call(this, elementId, placeholder);
    var self = this;
    this.membersButtons = {};
    this.buttonFactory = new xplive.Widgets.ButtonFactory();
    this.memberButtonConfigurator = new xplive.Widgets.MemberButtonConfigurator();

    this.onMemberButtonClicked = function(username){}; // event    

    this.updateButton = function(username, userActivity){
        this.membersButtons[username] = 
            this.membersButtons[username] ||
            this.buttonFactory.createButton(username, this);
        this.membersButtons[username].onClick = function(){
            self.onMemberButtonClicked(username);
        };    
        this.memberButtonConfigurator.showMemberStatusInButton(
            this.membersButtons[username], userActivity, username);
    };

    this.buttonFor = function(username){
        return this.membersButtons[username];
    };
};
xplive.Widgets.MemberButtonsBar.prototype = new sOn.Widgets.Panel();


///////////////////////////////////

xplive.Widgets.ExclusiveButtonToolbar = function(){
    sOn.Widgets.Widget.call(this);
    var buttons = {};

    this.addButtons = function(nameIdPairs){
        for (var name in nameIdPairs){
            var domId = nameIdPairs[name];
            button = new sOn.Widgets.Button(domId);
            button.initialize();
            buttons[name] = button;
        }
    };

    this.getButton = function(name){
        return buttons[name];
    };

    this.activate = function(name){
        for (var bName in buttons){
            buttons[bName].removeClass(xplive.Widgets.ExclusiveButtonToolbar.activeCss);
        }
        buttons[name].addClass(xplive.Widgets.ExclusiveButtonToolbar.activeCss);
    };
};

xplive.Widgets.ExclusiveButtonToolbar.activeCss = "active";

xplive.Widgets.ExclusivePanelList = function(){
    sOn.Widgets.Widget.call(this);
    var panels = {};

    this.addPanels = function(nameIdPairs){
        for (var name in nameIdPairs){
            var domId = nameIdPairs[name];
            panel = new sOn.Widgets.Panel(domId);
            panel.initialize();
            panels[name] = panel;
        }
    };

    this.getPanel = function(name){
        return panels[name];
    };

    this.show = function(name){
        for (var bName in panels){
            panels[bName].hide();
        }
        panels[name].show();
    };

    this.hide = function(name){
        panels[name].hide();
    };

    this.showAllBut = function(name){
      for (var bName in panels){
            panels[bName].show();
        }
        panels[name].hide();  
    };
};

xplive.Widgets.SoundPlayer = function(fullFilePath, placeholder){
    sOn.Widgets.Widget.call(this, sOn.Widgets.getRandomId(), placeholder);
    this.fullFilePath = fullFilePath;
    this.play = function(){
        if (xplive.Widgets.SoundPlayer.isTestMode)
            return;
        try{
            var ntv = this.getNativeWidget()[0];
            ntv.volume = 0.5;
            if((ntv.readyState === 0) && ('webkitAudioContext' in window))//trick for Safari ;-)
                ntv.src = fullFilePath + ".mp3";
            else
                ntv.currentTime = 0;
            if (ntv.currentTime > 0) // trick for Chrome
                if (ntv.canPlayType('audio/mpeg'))
                    ntv.src = fullFilePath + ".mp3";
                else
                    ntv.src = fullFilePath + ".ogg";

            ntv.play();
        }
        catch(e){ /* dont do this at home */}
    };
};

xplive.Widgets.SoundPlayer.isTestMode = false;

xplive.Widgets.SoundPlayer.prototype = new sOn.Widgets.Widget();

xplive.Widgets.SoundPlayer.prototype._createDomElement = function(){
    if (xplive.Widgets.SoundPlayer.isTestMode)
        return;
    var html = '<audio>';
    html += '<source src="' + this.fullFilePath + '.ogg" type="audio/ogg">';
    html += '</audio>';
    var nativeWidget = $(html);
    nativeWidget.appendTo(this.placeholder);
    this.registerNativeWidget(nativeWidget);
};

xplive.Widgets.PomodoroPopup = function(){
    this.alert = function(){
        var popup = window.open('', 
        'Pomodoro is finished', 
        'width=300,height=130, menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1');
        var content ='<html><head><title>Pomodoro has finished</title></head>';
        content += '<body style="background-color: #eee; color: #013B58;"><h3>Pomodoro has finished</h3><h4>It is time to take a short break, it is really important to rest for a few minutes.</h4></body></html>';
        popup.document.writeln(content);
        popup.document.close();
    };
                
};

xplive.Widgets.StatusWidget = function(config){
    sOn.Widgets.Panel.call(this, config.elementId, config.placeholder);
    this.config = config;
    this.onLocationChanged = function(location){/* event */};
};

xplive.Widgets.StatusWidget.prototype = new sOn.Widgets.Panel();
xplive.Widgets.StatusWidget.constructor = xplive.Widgets.StatusWidget;
xplive.Widgets.StatusWidget.prototype._initializeDomElement = function(){
    var self = this;
    this.locationDropdown = new sOn.Widgets.DropDown(this.config.dropdown, 
        this.config.placeholder);
    this.locationDropdown.initialize();
    for(var name in xplive.Common.Locations){
        this.locationDropdown.addOption(xplive.Common.Locations[name], xplive.Common.Locations[name]);
    }
    this.locationDropdown.selectByValue(xplive.Common.Locations.IamAtMyOfficeDesk);
    this.locationDropdown.onChange = function(value){
        self.onLocationChanged(value);
    };
}; 

xplive.Widgets.ProgressBar = function(elementId, placeholder){
	elementId = elementId || sOn.Widgets.getRandomId();
	sOn.Widgets.Panel.call(this, elementId, placeholder);

	this._createDomElement = function () {
        this.labelId = "label_" + sOn.Widgets.getRandomId();
		this.barId = "bar_" + sOn.Widgets.getRandomId();
		var barHtml  = '<div id="' + elementId + '">';
		    barHtml += '  <div id="' + this.labelId + '">To start the countdown click the play button</div>';
			barHtml += '  <div class="progress progress-striped active">';
    		barHtml += '    <div id ="' + this.barId + '" class="bar" style="width: 0%;">0%</div>';
    		barHtml += '  </div>';
			barHtml += '</div>';
		var nativeWidget = $(barHtml);
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	var _label = null, _bar = null;
	this.label = function () {
		if (!_label)
			_label = $('#' + this.labelId);
		return _label;
	};
	this.bar = function () {
		if (!_bar)
			_bar = $('#' + this.barId);
		return _bar;
	};
	
	this.inactiveBar = function () {
		$('#' + this.elementId).find(".progress").removeClass('active');
		this.label().removeClass("lead");
	};
	
	this.remarkMinuteChange = function () {
		this.label().addClass("minuteChange");		
	};
	
	this.start = function () {
		this.label().addClass("lead");
		$('#' + this.elementId).find(".progress").addClass('active');
	};
	
	this.update = function(progress){
		this.label().removeClass("minuteChange");
    var username = progress.username || "";
    this.label().text(username + " " + progress.remainingMinutes);
		var progressTxt = progress.percent.toString() + "%";
		this.bar().css('width', progressTxt);
		this.bar().text("completed " + progressTxt);
    };
};
xplive.Widgets.ProgressBar.prototype = new sOn.Widgets.Panel();

///////////////////////////////////////////////////

xplive.Widgets.SharedCode = function(codeViewer, inputBox){
    var self = {};

    self.onMessageEntered = function(){};

    self.initialize = function(){
        inputBox.initialize();
        inputBox.onMessageEntered = function(text){
              self.onMessageEntered(text);
        };
    };

    self.text = function(){
        return inputBox.text();
    };

    self.disable = function(){
        inputBox.disable();
    };

    self.enable = function(){
        inputBox.enable();
    };

    self.focus = function(){
        inputBox.focus();
    };

    self.showMessage = function(msg){
        codeViewer.showMessage(msg);
    };
    return self;
};


xplive.Widgets.createSharedLinksWidget = function(descriptionBox, urlBox, submitBtn, contentsBox){
    var self = {};
    var handlers = [];
    self.onLinkAdded = function(handler){
        handlers.push(handler);
    };

    self.addSharedLinkFromColleague = function(description, url){
         addLink(description, url);
    };

    urlBox.keypress(function (e) {
      if (e.which == 13) {
        submitUrl();
      }
    });

    submitBtn.click(function(){
        submitUrl();
    });

    function submitUrl (){
        var description = descriptionBox.val();
        var url = urlBox.val();
        if (description === ""){
           description = url;
        }
        url = fixUrl(url);
        addLink(description, url);
        cleanUp();
        fireEvent(description, url);
    }

    function addLink(description, url){
        var html = formatLink(url, description); 
        if (contentsBox.html().indexOf(html) == -1){
           contentsBox.append(html); 
        }
    }

    function fireEvent (description, url){
        handlers.forEach(function(handler){
           handler(description, url);
        }); 
    }

    function formatLink (url, description){
        return '<li><a href="' + url + '">' + description + '</a></li>'; 
    }

    function fixUrl(url){
        if (url.indexOf('http') < 0){
           url = "http://" + url;
        }
        return url;
    }

    function cleanUp (){
        urlBox.val('');
        descriptionBox.val('');

    }

    return self;
};

