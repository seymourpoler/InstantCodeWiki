xplive.Factory = {};

xplive.Factory.createCodeDisplay = function(){
    if (typeof(ace) != "undefined"){
       var display = ace.edit("wholeTeamChat");
       display.setTheme("ace/theme/monokai");
       display.getSession().setMode("ace/mode/java");
       display.setFontSize("15");
       display.setReadOnly(true);
       return display;
    }
    return {};
}

xplive.Factory.createAlertNotifier = function(session){
    var dialog = new sOn.Widgets.ConfirmationDialog(
                    'notificationDialog', null, 'closeDialog');
    dialog.shouldOverwriteButtonLabels = false;
    $('#notificationDialog').draggable();
    dialog.setText = function(text){
        $('#dialog-message').text(text);
    };
    return xplive.Services.AlertNotifier(session, 
               new xplive.Widgets.WindowManager(), 
               new xplive.Widgets.SoundPlayer('/static/ring'),
               dialog);
};

xplive.Factory.createSharedCodeWidget = function(){
   var editor = xplive.Factory.createCodeDisplay(); 
   var inputBox = new xplive.Widgets.ChatInputBox("wholeTeamChatInput");
   var widget = xplive.Widgets.SharedCode(
                   new xplive.Widgets.SourceCodeEditor(editor), inputBox);
   return widget;
};

xplive.Factory.createTeamCommunicator = function(session){
    if (!session)
       session = new xplive.SessionManager().browserSession();
    var communicator = new xplive.Services.TeamCommunicator(session);
    communicator.attachChatProxy(new xplive.Chat.ChatProxy(session));
    communicator.attachRoster(new xplive.Widgets.Roster("teamViewer"));
    communicator.attachNotifier(xplive.Factory.createAlertNotifier(session));
    communicator.attachWindowCloseDetector(new xplive.Services.WindowCloseDetector());
    communicator.attachClock(new xplive.Clock());
    //$('#teamChat').draggable({cancel: 'textarea,.whole-team-chat'});
    $('#teamMonitor').draggable();
    communicator.attachCodeWidget(xplive.Factory.createSharedCodeWidget());
    communicator.attachSharedLinksWidget(xplive.Widgets.createSharedLinksWidget(
       $('#linkDesc'), $('#linkUrl'), $('#linkSubmit'), $('#sharedLinks')));
    return communicator;
};

xplive.Factory.createApp = function(){
   return {
        teamCommunicator: xplive.Factory.createTeamCommunicator(),
        activityDetector: new xplive.Services.UserActivityDetector(),
        windowManager: new xplive.Widgets.WindowManager(),
        initialize: function(){
            this.activityDetector.initialize();
            this.teamCommunicator.initialize();
        },
        shareLink: function(description, url){
            this.teamCommunicator.shareLink(description, url);
        }
   };
};
