var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use('/static', express.static(path.join(__dirname, '/static')));
app.use(express.cookieParser());
app.engine('html', require('ejs').renderFile);

var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var redisWrap = require('./redisClient');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function setCookieId(req, res){
   if (!req.cookies || !req.cookies.id){
     var id = "" + (Math.random() * 10000000000000000 * Math.random());
     res.cookie('id', id, {maxAge: 900000});
   }
}

app.get('/', function(req, res){
   setCookieId(req, res);
   res.render('landing.html', {version: '.'});
});

app.get(/^\/(.+)\/(.+)$/, function(req, res){
   setCookieId(req, res);
   var team = req.params[0];
   var user = req.params[1];
   res.render('index.html', {version: '.', user: user, team: team});
});

var server = http.createServer(app).listen(
  app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require('socket.io').listen(server);
io.configure(function () {
  io.set("transports", ["websocket", "xhr-polling"]);
    io.set("polling duration", 10);
});
  
  
var CONNECTED_USERS = 'connectedUsers';


var redisClient = redisWrap(redis);

io.sockets.on('connection', function (socket) {
  socket.on('sendMessage', function (msg) {
      io.sockets.emit('receivedMessage' + msg.receiver, msg);
  });
  socket.on('confirmReception', function(msg){
        io.sockets.emit('confirmationReceived' + msg.confirmTo, msg);
  });
  socket.on('sendTeamMessage', function (msg) {
      redisClient.appendTeamMessageToStore(msg);
      io.sockets.emit('receivedTeamMessage' + msg.team, msg);
  });
  socket.on('shareLink', function (link) {
      redisClient.appendLinkToStore(link);
      io.sockets.emit('receivedLink' + link.team, link);
  });
  socket.on('greeting', function(msg){
     socket._greetingMessage = msg;
     io.sockets.emit('newMateJoined' + msg.team, msg);
     redisClient.retrieveSharedLinks(sendAllExistingLinks, msg.team);
     redisClient.retrieveStoredTeamMessages(sendAllExistingSharedCode, msg.team);
     function sendAllExistingSharedCode(teamMessages) {
        socket.emit('teamMessages', teamMessages);
     }
     function sendAllExistingLinks (links){
        socket.emit('sharedLinks', links);
     }
  });
  socket.on('disconnect', function(){
      var msg = socket._greetingMessage;
      if (msg){
         io.sockets.emit('mateIsGone' + msg.team, msg);
      }
  });
  socket.on('onMateGone', function(msg){
      io.sockets.emit('mateIsGone' + msg.team, msg);
  });
  socket.on('welcomeMate', function(session){
      io.sockets.emit('mateIsWelcoming' + session.team, session);
  });
  socket.on('onMateInactive', function(msg){
      io.sockets.emit('mateInactive' + msg.team, msg);
  });
  socket.on('onMateActive', function(msg){
      io.sockets.emit('mateActive' + msg.team, msg);
  });

  socket.emit('connected');
});


console.log('------------- CLEANING CACHE ----------------');
//storeObjectBy(CONNECTED_USERS, []);
