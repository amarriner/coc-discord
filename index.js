const config = require("./config.json");
const discord = require("./discord.js");
const utils = require("./utils.js");

const commandPrefix = config.commandPrefix;

discord.client.on('ready', () => {

   utils.loadDataFiles();

   setInterval(function() {
      utils.loadDataFiles();
   }, 30 * 60 * 1000);

   discord.client.user.setActivity(" Great Cthulhu rise from the depths ", { type: "WATCHING" });

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

      var stat = parameters.filter(p => (!p.startsWith("*"))).join(" ");

      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");
      if (alias === "") { alias = undefined; }

      var r = utils.getCharacterStat(message.author.id, stat, alias);
      message.channel.send(r.error === undefined ? r.message : r.error);

   }

   if (message.content.startsWith(commandPrefix + "rollmy")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+") && !p.startsWith("-"))).join(" ");

      var dice = 1;
      if (parameters.filter(p => (p.startsWith("+"))).join() !== "") {
         dice = 1 + parseInt(parameters.filter(p => (p.startsWith("+"))).join().replace(/^\+/, ""));
      }
      if (parameters.filter(p => (p.startsWith("-"))).join() !== "") {
         dice = -1 + parseInt(parameters.filter(p => (p.startsWith("-"))).join());
      }
      dice = parseInt(dice);

      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, ""); 
      if (alias === "") { alias = undefined; }

      var r = utils.getCharacterStat(message.author.id, stat, alias);
      var title; 
      var value;

      if (r.error !== undefined) {
         message.channel.send(r.error);
         return;
      } 

      if (r.attributeValue) {
         title = r.attributeName;
         value = r.attributeValue;
      }

      else if (r.skills !== undefined && r.skills.length === 1) {
         title = r.skills[0].obj.description;
         value = r.skills[0].obj.value;
      }

      else {
         message.channel.send("ERROR: Either more than one or zero skills found for " + stat);
         return;
      }

      var diceRollResult = utils.rollDice(dice);
      r.message.timestamp = new Date();
      r.message.footer = {};
      r.message.footer.text = "Roll result: " + ((diceRollResult.length > 1) ? diceRollResult.join(", ") : diceRollResult[0]);
      r.message.footer.icon_url = (parseInt(parseInt(diceRollResult[0])) <= parseInt(value)) ? config.rollSuccessUrl : config.rollFailureUrl;
      message.channel.send(r.message);

   }

   if (message.content.startsWith(commandPrefix + "reload")) {

      var user = utils.getUser(message.author.id);
      if (user !== undefined && user.gm) {
         utils.loadDataFiles();
      }

   }

});

discord.client.login(config.botToken);

