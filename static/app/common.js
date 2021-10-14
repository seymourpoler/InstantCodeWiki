var xplive = {}; // xplive is the namespace
xplive.AppName = "Instant Code Wiki";
xplive.Interactors || (xplive.Interactors = {});
xplive.Common || (xplive.Common = {});
xplive.Events || (xplive.Events = {});
xplive.Storage || (xplive.Storage = {});
xplive.Widgets || (xplive.Widgets = {});
xplive.Services || (xplive.Services = {});
xplive.Chat || (xplive.Chat = {});

xplive.Styles = {
    disabled: 'disabled',
    memberOnPomodoro: 'btn btn-danger',
    memberAvailable: 'btn btn-info',
    memberOffline: 'btn offline',
    memberIsTakingBreak: 'btn btn-warning',
    memberDetails: 'modal hide fade in',
    memberIsMyself: 'myself',
    severalSessionsOpenWithSameAccount: 'btn btn-inverse',
};

xplive.SessionManager = function(){
    this.locationGetter = { 
                path: function(){ return window.location.pathname},
                host: function(){ return window.location.protocol+"//"+window.location.host}
    },
    this.browserSession = function(){
         var path = this.locationGetter.path();
         path = decodeURI(path);
         path = path.replace(/ /g, "").toLowerCase();
         var parts = path.split("/");
         var sid = Math.random().toString().substring(2,5);
         return { team: parts[1], username: parts[2], 
                  host: this.locationGetter.host(),
                  sid: sid};
    };
};

xplive.Common.MaximunTeamInactivity = 43200000; // 12 hours in milliseconds
xplive.Common.MaximunMissingMateUpdatesToConsiderOffline = 20;
xplive.Common.ActivityIsSentAtLeast = 7;
xplive.Common.InteractWithTeamEvery = 2500; // milliseconds
xplive.Common.TimeToConsiderInactivity = 40000; // interaction with window
//xplive.Common.ChatServerAddress = 'codingworkshop.herokuapp.com:80';
//xplive.Common.ChatServerAddress = 'socratesuk.herokuapp.com:80';
xplive.Common.ChatServerAddress = 'http://127.0.0.1:3000';
xplive.Common.Team = 'team'
xplive.Common.shouldAskOnWindowClosing = false;

xplive.Events.iHaveChangedMyActivity = "I have changed my activity";
xplive.Events.iAmDoingTheSameThing = "My activity hasnt changed";
xplive.Events.iAmUpdatingMyMatesActivity = "I am updating my mate activity";
xplive.Events.thereIsNewTeamActivity = "There is new team activity";
xplive.Events.thereIsNewMateActivity = "There is new mate activity";
xplive.Events.userIsNotInteractingWithWindow = "User is not interacting with the window";
xplive.Events.userIsActiveAgain = "User is active again";
xplive.Events.itIsTimeToReviewMyActivity = "It is time to review my activity";
xplive.Events.onShowMateInfo = 'OnShowMateInfo';
xplive.Events.windowIsVisible = 'windowIsVisible';
xplive.Events.windowIsNotVisible = 'windowIsNotVisible';
xplive.Events.newPomodoroStarted = 'newPomodoroStarted';
xplive.Events.pomodoroChanged = 'onPomodoroChanged';
xplive.Events.pomodoroFinished = 'pomodoroFinished';
xplive.Events.taskChanged = 'taskChanged';

xplive.Common.ExecAsync = function(func, delay){
    setTimeout(function(){
        func();
    }, delay);
};



