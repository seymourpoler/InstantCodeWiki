var AppRouter = Backbone.Router.extend({
    routes:{          
        "dashboard" : "index",
        "team": "index",
    },
    index: function() {
      $('#tabs').show();
      window.menu.activate('dashboard');
      this.tasks();
    },
    team: function(){
      $('#tabs').hide();
      window.panels.show('team');
      window.menu.activate('team');
    },
 });

window.startup = function (){
   xplive.App = xplive.Factory.createApp();
   xplive.App.initialize();
   window.readyForTestRunner = true;
};

$(document).ready(function () {
   startup();
   var router = new AppRouter();
   Backbone.history.start();
});
