const config = require("./config.json");
const discord = require("./discord.js");
const utils = require("./utils.js");

const commandPrefix = config.commandPrefix;

discord.client.on('ready', () => {

   utils.loadDataFiles();

   discord.client.user.setActivity(" Great Cthulhu rise from the depths ", { type: "WATCHING" });

   console.log('I am ready!');

});

discord.client.on("message", message => {

   //
   // Display character sheet
   // This is mostly obsolete since the other actions also display the same 
   // information or more
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "sheet")) {

      var [command, alias] = message.content.split(" ");
      var r = utils.getCharacterSheet(message.author.id, alias);
      message.channel.send(r.error === undefined ? r.embed : r.error );
 
   }

   //
   // This will look up attributes and/or skills and display them as a discord
   // embed assuming if finds them
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "my")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");
      if (alias === "") { alias = undefined; }

      var r;
      var stat = parameters.filter(p => (!p.startsWith("*"))).join(" ");
      for (var i = 0; i < stat.split(",").length; i++) {

         s = utils.getCharacterStat(message.author.id, stat.split(",")[i].trim(), alias);
         if (r === undefined) {
            r = s;
         }

         else if (s.error === undefined) {
            r.message.fields = r.message.fields.concat(s.message.fields); 
         }

      }

      message.channel.send(r.error === undefined ? r.message : r.error);

   }

   //
   // This will roll percentile dice against an attribute or skill
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "rollmy")) {

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
      if ((parseInt(parseInt(diceRollResult[0])) > parseInt(value))) {
         r.message.color = 15158332;
      }
      r.message.footer = {};
      r.message.footer.text = "Roll result: " + ((diceRollResult.length > 1) ? diceRollResult.join(", ") : diceRollResult[0]);
      r.message.footer.icon_url = (parseInt(parseInt(diceRollResult[0])) <= parseInt(value)) ? config.rollSuccessUrl : config.rollFailureUrl;
      message.channel.send(r.message);

   }

   //
   // Update a character's attribute or skill
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "set")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+"))).join(" ");
      var value = parameters.filter(p => (p.startsWith("+"))).join().replace(/^\+/, "");
      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

      if (stat === "" || value === "" || alias === "") {
         message.channel.send("ERROR: Invalid set command");
         return;
      }

      message.channel.send(utils.updateCharacterStat(stat, parseInt(value), alias));

   }

   //
   // Reload JSON files from disk
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "reload")) {

      var user = utils.getUser(message.author.id);
      if (user !== undefined && user.gm) {
         utils.loadDataFiles();
      }

   }

   //
   // Save data objects out to disk as JSON
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "save")) {

      var user = utils.getUser(message.author.id);
      if (user !== undefined && user.gm) {
         utils.saveDataFiles();
      }
   
   }

});

discord.client.login(config.botToken);

