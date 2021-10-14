
var io = io || {connect: function(){return {on: function(){}, emit: function(){}}}};

xplive.Chat.ChatProxy = function(session){
	var socket;
	var self = this;
	this.connect = function(){
		socket = io.connect(xplive.Common.ChatServerAddress);
    socket.on('connected', function(){
        socket.emit('greeting', session);
    });
		socket.on('receivedMessage' + session.team + session.username,
			function(msg){
			self.onReceivedMessage(msg);
		});
		socket.on('receivedTeamMessage' + session.team, 
			function(msg){
			self.onWholeTeamMessage(msg);
		});
		socket.on('receivedLink' + session.team, 
			function(link){
			self.onSharedLinkReceived(link);
		});
    socket.on('newMateJoined' + session.team, function(msg) {
      self.onMateJoined(msg);
      socket.emit('welcomeMate', session);
    });
    socket.on('mateIsWelcoming' + session.team, function(msg) {
      self.onMateJoined(msg);
    });
    socket.on('mateIsGone' + session.team, function(msg) {
      self.onMateGone(msg);
    });
    socket.on('mateActive' + session.team, function(msg) {
      self.onMateActive(msg);
    });
    socket.on('mateInactive' + session.team, function(msg) {
      self.onMateInactive(msg);
    });
    socket.on('connectedUsers', function(list){
      self.onConnectedUsersReceived(list);
    });
    socket.on('teamMessages', function(list){
      self.onTeamMessagesLoaded(JSON.parse(list));
    });
    socket.on('sharedLinks', function(list){
      self.onLinksLoaded(JSON.parse(list));
    });
    socket.on('disconnect', function(){
      self.onDisconnected();
    });
    socket.on('connect', function(){
      self.onConnected();
    });
		socket.on('confirmationReceived' + session.team + session.username,
			function(msg){
				msg.receiver = msg.receiver.replace(session.team, "");
				self.onConfirmationReceived(msg);
		});
	};

  this.shareLink = function(link){
    socket.emit('shareLink', link);
  };

	this.confirmReception = function(msg){
		msg.confirmTo = session.team + msg.sender;
		socket.emit('confirmReception', msg);
	};

	this.sendMessage = function(msg){
		msg.receiver = session.team + msg.receiver;
		socket.emit('sendMessage', msg);
	};

	this.sendMessageToTeam = function(msg){
		socket.emit('sendTeamMessage', msg);
	};

  this.sayGoodbye = function(){
    socket.emit('onMateGone', session); 
  };

  this.onConnectedUsersReceived = function(list){

  };

  this.onTeamMessagesLoaded = function(list){

  };

  this.onLinksLoaded = function(list){

  };

  this.onDisconnected = function(){

  };

  this.onConnected = function(){

  };


  this.showInactivity = function(){
    socket.emit('onMateInactive', {team: session.team, username: session.username});
  };

  this.showActivity = function(){
    socket.emit('onMateActive', {team: session.team, username: session.username});
  };

	this.onConfirmationReceived = function(msg){

	};
	this.onMateJoined = function(msg){

	};
	this.onMateGone = function(msg){

	};
	this.onMateActive = function(msg){

	};
	this.onMateInactive = function(msg){

	};

	this.onReceivedMessage = function(msg){
		
	};

	this.onWholeTeamMessage = function(msg){
		
	};

  this.onSharedLinkReceived = function(link){

  };

}
