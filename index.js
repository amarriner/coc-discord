const config = require("./config.json");
const discord = require("./discord.js");
const utils = require("./utils.js");


const commandPrefix = config.commandPrefix;

discord.client.on('ready', () => {

   utils.loadDataFiles();

   setInterval(function() {
      utils.loadDataFiles();
   }, 30 * 60 * 1000);

   console.log('I am ready!');

});

discord.client.on("message", message => {

   if (message.content.startsWith(commandPrefix + "sheet")) {

      var [command, alias] = message.content.split(" ");
      var r = utils.getCharacterSheet(message.author.id, alias);
      message.channel.send(r.error === undefined ? r.embed : r.error );
 
   }

   if (message.content.startsWith(commandPrefix + "my")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var stat = parameters.filter(p => (!p.startsWith("+"))).join(" ");

      var alias = parameters.filter(p => (p.startsWith("+"))).join().replace(/^\+/, "");
      if (alias === "") { alias = undefined; }

      var r = utils.getCharacterStat(message.author.id, stat, alias);
      message.channel.send(r.error === undefined ? r.message : r.error);
   }

   if (message.content.startsWith(commandPrefix + "rollmy")) {
      var [command, attribute, alias] = message.content.split(" ");
      var r = utils.rollCharacterAttribute(message.author.id, attribute, alias);
      message.channel.send(r.error === undefined ? r.message : r.error);
   }

   if (message.content.startsWith(commandPrefix + "reload")) {

      var user = utils.getUser(message.author.id);
      if (user !== undefined && user.gm) {
         utils.loadDataFiles();
      }

   }

});

discord.client.login(config.botToken);

