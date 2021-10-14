//////////////////////////////////////////////////////////////
/*
EventBus: Publisher/Subscriber implementation
*/
/////////////////////////////////////////////////////////////
sOn.EventBus = function(){
  var subscribersInfo = [];

  this.addSubscriber = function(callback){
      var eventNames = [].slice.call(arguments).slice(1);
      subscribersInfo.push({
        subscriber: callback, eventNames: eventNames});
  };

  this.emit = function(eventName, eventArgs){
      for(var i = 0, len = subscribersInfo.length; i < len; i++){
          var info = subscribersInfo[i];
          for (var j = 0, lenj = info.eventNames.length; j < lenj; j++){
              if (info.eventNames[j] == eventName)
                  info.subscriber(eventName, eventArgs);
          }
      };
  }
};

var singleton = new sOn.EventBus();

sOn.Factory.ResetEventBus = function(){
  singleton = new sOn.EventBus();
};
sOn.Factory.EventBus = function(){
  return singleton;
};


/////////////////////////////////////////////////////////////
/*
WindowCloseDetector: knows when the window is being closed and notifies
listeners. The TeamServices subscribes this to inform others that user
is leaving.
*/
/////////////////////////////////////////////////////////////
xplive.Services.WindowCloseDetector = function(){
  
  var self = this;

  var onClosing = function(){
      if (self.listener)
        self.listener.onClosing();
      if (xplive.Common.shouldAskOnWindowClosing)
        return "You are about to sign out.";
  }; 

  this.subscribe = function(listener){
    self.listener = listener;
  };

  this.initialize = function(){
    window.onbeforeunload = onClosing;
  };
};

//////////////////////////////////////////////////////////////
/*
UserActivityDetector: knows when the user is not interacting with the window
*/
/////////////////////////////////////////////////////////////
xplive.Services.UserActivityDetector = function(){
  
  var onUserInactive = function(){
      sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
  };

  var onUserActive = function(){
      sOn.Factory.EventBus().emit(xplive.Events.userIsActiveAgain);
  };

  var onWindowVisible = function(){
      sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
  };

  var onWindowNotVisible = function(){
      sOn.Factory.EventBus().emit(xplive.Events.windowIsNotVisible);
  };

  this.initialize = function(millisecondsToConsiderUserInactive){
    $.idleTimer(millisecondsToConsiderUserInactive || xplive.Common.TimeToConsiderInactivity);
    $(document).bind("idle.idleTimer", function(){
      onUserInactive();
    });
    $(document).bind("active.idleTimer", function(){
      onUserActive();
    });
    Visibility.change(function(evt, evtType){
        if (evtType == "hidden")
          onWindowNotVisible();
        if (evtType == "visible")
          onWindowVisible();
    });
  };
  
  this.reset = function(){
    $.idleTimer('destroy');    
  }
};

/////////////////////////////////////////////////////////////

xplive.Services.MessagesStack = function(){
  var storedMessages = [];

  this.storeMessage = function(msg){
      storedMessages.push(msg);
  };

  this.popAllMessages = function(){
      var clone = storedMessages.slice(0);
      storedMessages = [];
      return clone;
  };
};

xplive.Services.AlertNotifier = function(session, 
                    windowManager, soundPlayer, dialog){
    var self = {};

    self.initialize = function(){
        dialog.initialize();
    };

    self.notifyUser = function(msg){
        windowManager.animateTitle('chat: ' + msg.sender +' is talking');
        var notificationTxt = msg.body.substring(0, 20) +  "...";
        windowManager.popUpNotification(
              msg.sender +" is talking:", notificationTxt);
        soundPlayer.play();
    };

    self.notifyDisconnection = function(){
        dialog.setText("There are network connection problems. You are now disconnected from the server. The system is trying to reconnect, please wait...  or reload the page if it doesn't connect after a minute.");
dialog.show();
    };

    self.notifyReconnection = function(){
        dialog.setText('You are now connected! welcome back :-)');
        dialog.show();
    };

    self.dismissNotification = function(){
        windowManager.stopTitleAnimation();
        windowManager.closeCurrentNotification();
    };

    return self;
};

//////////////////////////////////////////////////////////////
/*
TeamCommunicator: handles chats
*/
/////////////////////////////////////////////////////////////
xplive.Services.TeamCommunicator = function(session){
    sOn.Interactors.Interactor.call(this, [
        'chatProxy', 'roster', 'notifier', 
        'codeWidget', 'windowCloseDetector', 'clock', 'sharedLinksWidget']);
    var self = this, sentMessagesCount = 1, isWindowVisible = true;

    this._postInitialize = function(){
        this._chatProxy.connect();
    };

    this.sendMessage = function(body){
        var msg = {body: body};
        return {
            to: function(receiver){
                  sendMsgThroughProxy(receiver, msg);
                  self._roster.showNewMessage(receiver, msg);
            }
        };
    };

    this.shareLink = function(description, url){
        self._chatProxy.shareLink({description: description, url: url, 
                                   team: session.team});
    };

    this.sendMessageToTeam = function(msg){
        self._chatProxy.sendMessageToTeam(msg);
    };
    
    this._subscribeEvents = function(){
        subscribeToEventBus.call(this);
        subscribeToChatProxy.call(this);
        subscribeToCodeWidget.call(this);
        this._roster.onNewMessageIntroduced = function (receiver, body){
              // TODO: separate presentation details
              body = "<pre>" + body + "</pre>";
              var msg = prepareMessage(receiver, body);
              self._roster.showPendingMessage(receiver, msg);
              sendMsgThroughProxy(receiver, msg);
        };

        this._windowCloseDetector.subscribe({
               onClosing: function(){
               }
        });

        this._sharedLinksWidget.onLinkAdded(function(description, url){
            self.shareLink(description, url);
        });
    };

    function subscribeToChatProxy(){
        var lastConfirmationSent = null, isConnected = null;
        self._chatProxy.onReceivedMessage = function (msg){
              self._chatProxy.confirmReception(msg);
              setReceiptTime(msg);
              self._roster.showNewMessage(msg.sender, msg);
              if (!isWindowVisible){
                   self._notifier.notifyUser(msg);
              }
        };
        self._chatProxy.onSharedLinkReceived = function(link){
              self._sharedLinksWidget.addSharedLinkFromColleague(link.description, link.url);
        };

        self._chatProxy.onConfirmationReceived = function (msg){
              if (confirmationHasArrivedOnceAlready(msg)){
                 return;
              }
              lastConfirmationSent = msg;
              self._roster.moveMessageFromPendingToSent(msg.receiver, msg);
        };
        function confirmationHasArrivedOnceAlready(msg){
              return lastConfirmationSent && lastConfirmationSent.id == msg.id;
        };
        self._chatProxy.onMateJoined = function(msg){
            var activity = {username: msg.username};
            if (msg.username == session.username)
               activity.itsMe = true;
            handleNewActivity(activity);
        };
        self._chatProxy.onMateGone = function(msg){
            var activity = {username: msg.username};
            activity.isApparentlyOffline = true;
            handleNewActivity(activity);
        };
        self._chatProxy.onMateInactive = function(msg){
            var activity = {username: msg.username};
            if (msg.username == session.username)
               activity.itsMe = true;
            activity.isTakingBreak = true;
            handleNewActivity(activity);
        };
        self._chatProxy.onMateActive = function(msg){
            var activity = {username: msg.username};
            if (msg.username == session.username)
               activity.itsMe = true;
            activity.isTakingBreak = false;
            handleNewActivity(activity);
        };
        self._chatProxy.onConnectedUsersReceived = function(connectedUsers){
            for (var key in connectedUsers){
                var activity = connectedUsers[key];
                if (activity){
                  if (activity.username == session.username){
                     activity.itsMe = true;
                  }
                  handleNewActivity(activity);
                }
            }
        };
        self._chatProxy.onDisconnected = function(){
           isConnected = false;
           self._notifier.notifyDisconnection();
           self._codeWidget.disable();
        }
        self._chatProxy.onConnected = function(){
            if (isConnected === false){
              isConnected = true;
              self._codeWidget.enable();
              self._notifier.notifyReconnection();
            }
        }
        self._chatProxy.onWholeTeamMessage = function(msg){
            displayTeamMessage(msg);
        };
        self._chatProxy.onTeamMessagesLoaded = function(list){
            if (!list)
              return;
            for (var i = 0; i < list.length; i ++)
              displayTeamMessage(list[i]);
        };
        self._chatProxy.onLinksLoaded = function(links){
            links.forEach(function(link){
              self._sharedLinksWidget.addSharedLinkFromColleague(link.description, link.url);
            });
        };

    }

    function subscribeToCodeWidget(){
        self._codeWidget.focus();
        self._codeWidget.onMessageEntered = function(text){
            var msg = prepareMessage(xplive.Common.Team, text);
            self._chatProxy.sendMessageToTeam(msg);
        };
    }

    function subscribeToEventBus(){
        sOn.Factory.EventBus().addSubscriber(
                                       handleVisibleWindow, 
                                       xplive.Events.windowIsVisible);
        sOn.Factory.EventBus().addSubscriber(
                                       handleVisibleWindow, 
                                       xplive.Events.userIsActiveAgain);
        sOn.Factory.EventBus().addSubscriber(
                                       handleNotVisibleWindow, 
                                       xplive.Events.windowIsNotVisible);
        sOn.Factory.EventBus().addSubscriber(
                                       handleNotVisibleWindow, 
                                       xplive.Events.userIsNotInteractingWithWindow);
        sOn.Factory.EventBus().addSubscriber(function(){
                                      self._chatProxy.showInactivity();
                                   }, xplive.Events.userIsNotInteractingWithWindow);
        sOn.Factory.EventBus().addSubscriber(function(){
                                      self._chatProxy.showActivity();
                                   }, xplive.Events.userIsActiveAgain);

        function handleVisibleWindow(evtName, evtArgs){
             isWindowVisible = true;
             self._notifier.dismissNotification();
        }

        function handleNotVisibleWindow(evtName, evtArgs){
            isWindowVisible = false;
        }
    }


    function setReceiptTime(msg){
        msg.receiptTime = self.get.clock.giveMeTheTime();
        var visibleTimeParts = msg.receiptTime.toUTCString().split(' ');
        var usableParts = [visibleTimeParts[1], visibleTimeParts[2]];
        msg.visibleReceiptTime = usableParts.join(' ') + ' - ' + visibleTimeParts[4].substring(0, 5) + ' - ';
    }

    function sendMsgThroughProxy(receiver, msg){
        msg.receiver = receiver;
        msg.sender = session.username;
        self._chatProxy.sendMessage(msg);
    }

    function prepareMessage(receiver, body){
        var msg = {body: body, receiver: receiver,
                    sender: session.username, team: session.team};
        msg.id = sentMessagesCount;
        sentMessagesCount++;
        setReceiptTime(msg);
        return msg;
    }


    function displayTeamMessage(msg){
        if (!msg)
           return;
        setReceiptTime(msg);
        self._codeWidget.showMessage(msg);
    }

    function handleNewActivity(activity){
        self._roster.updateActivity(activity);
    }

};


