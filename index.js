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

   const filter = (reaction, user) => {
      return message.embeds !== undefined && 
             message.embeds.length === 1 && 
             message.embeds[0].footer.iconURL === config.rollSuccessUrl && 
             reaction._emoji.name === config.skillCheckEmoji && 
             utils.getUser(user.id).gm;
   };

   message.awaitReactions(filter, { max: 1, time: 12 * 60 * 60 * 1000 })
      .then(collected => {

         collected.first().users.cache.first().send(utils.addCharacterSkillCheck(message.embeds[0].fields[0].name, utils.getCharacterByName(message.embeds[0].title).rodbotAlias));

      }).catch(collected => {

      }
   );

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
   if (message.content.toLowerCase().startsWith(commandPrefix + "my ")) {

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

      var comment = "";
      var parameters

      if (message.content.split("#").length === 2) {
         parameters = message.content.split("#")[0].trim().split(" ");
         comment = "```" + message.content.split("#")[1].substr(0, 2041) + "```";
      }
      else {
         parameters = message.content.split(" ");
      }

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

      else if (r.skillObjects !== undefined && r.skillObjects.length === 1) {
         title = r.skillObjects[0].name;
         value = r.skillObjects[0].value;
      }

      else {
         message.channel.send("ERROR: Either more than one or zero skills found for " + stat);
         return;
      }

      var result = "Success"
      r.message.description += comment;
      var diceRollResult = utils.rollDice(dice);
      if (parseInt(parseInt(diceRollResult[0])) > parseInt(value)) {
         result = "Failure"
         r.message.color = config.rollFailureColor;
      }
      else if (diceRollResult[0] <= Math.floor(value / 5)) {
         result = "Extreme Success"
      }
      else if (diceRollResult[0] <= Math.floor(value / 2)) {
         result = "Hard Success"
      }
      r.message.footer = {};
      r.message.footer.text = result + " (" + ((diceRollResult.length > 1) ? diceRollResult.join(", ") : diceRollResult[0]) + ")";
      r.message.footer.icon_url = (parseInt(parseInt(diceRollResult[0])) <= parseInt(value)) ? config.rollSuccessUrl : config.rollFailureUrl;
      message.channel.send(r.message);

   }

   //
   // This will attempt to upgrade a character's skill and uncheck it either way
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "upgrademy")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+") && !p.startsWith("-"))).join(" ");

      var dice = 1;
      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");
      if (alias === "") { 
         alias = utils.getCharacter(message.author.id, undefined).rodbotAlias;
      }

      var r = utils.getCharacterStat(message.author.id, stat, alias);
      var title;
      var value;
      var intValue;
      var checked;

      if (r.error !== undefined) {
         message.channel.send(r.error);
         return;
      }

      else if (r.skillObjects !== undefined && r.skillObjects.length === 1) {
         title = r.skillObjects[0].name;
         value = r.skillObjects[0].value;
         intValue = r.skillObjects[0].intValue;
         checked = r.skillObjects[0].checked !== undefined ? r.skillObjects[0].checked : false;
      }

      else {
         message.channel.send("ERROR: Either more than one or zero skills found for " + stat);
         return;
      }

      var diceRollResult = utils.rollDice(dice);
      var result = "Success (" + diceRollResult[0] + ")";

      if (! checked) {
         result = "No checkmark for " + title;
         r.message.color = config.rollFailureColor;
         r.message.description += "```Upgrading " + title + "```";
      }
      else if (intValue >= 90) {

         var currentSanity = utils.getCharacterStat(message.author.id, "SAN", alias)[0]; 
         var moreSanity = Math.floor(Math.random() * 6) + 1;
         moreSanity += Math.floor(Math.random() * 6) + 1;
         if (moreSanity > 99) { moreSanity = 99; }

         var cthulhuMythos = utils.getCharacterStat(message.author.id, "Cthulhu Mythos", alias)[0];
         if (moreSanity > cthulhuMythos.skillObjects[0].value) { moreSanity = cthulhuMythos.value; }

         utils.updateCharacterStat("SAN", currentSanity.attribute.value + moreSanity, alias);
         r.message.description += "```Adding " + moreSanity + " to SAN because " + title + " is >= 90```";

      }
      else if (parseInt(parseInt(diceRollResult[0])) <= intValue) {
         result = "Failure (" + diceRollResult[0] + ")";
         r.message.color = config.rollFailureColor;
         r.message.description += "```Upgrading " + title + "```";
      }
      else {
         var upgradeAmount = Math.floor(Math.random() * 10) + 1;
         utils.updateCharacterStat(stat, intValue + upgradeAmount, alias)
         r.message.description += "```Adding " + upgradeAmount + " to " + title + " ```";
      }

      utils.removeCharacterSkillCheck(title, alias);

      r.message.footer = {};
      r.message.footer.text = result;
      r.message.footer.icon_url = (r.message.color === config.rollSuccessColor) ? config.rollSuccessUrl : config.rollFailureUrl;
      message.channel.send(r.message);

   }


   //
   // Update a character's attribute or skill
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "set")) {

      var user = utils.getUser(message.author.id);
      if (user === undefined || !user.gm) { return; }

      var parameters = message.content.split(" ");
      parameters.shift();

      var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+") && !p.startsWith("-") && !p.startsWith("="))).join(" ");
      var value = parameters.filter(p => (p.startsWith("+") || p.startsWith("-") || p.startsWith("="))).join().replace(/^[+-=]/, "");
      var action = parameters.filter(p => (p.startsWith("+") || p.startsWith("-") || p.startsWith("="))).join().charAt(0);
      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

      if (stat === "" || value === "" || alias === "") {
         message.channel.send("ERROR: Invalid set command");
         return;
      }

      message.channel.send(utils.updateCharacterStat(stat, parseInt(value), alias, action));

   }

   //
   // Check a skill for a character
   // 
   if (message.content.toLowerCase().startsWith(commandPrefix + "addcheck")) {

      var user = utils.getUser(message.author.id);  
      if (user === undefined || !user.gm) { return; }

      var parameters = message.content.split(" ");
      parameters.shift();

      var skillSearchTerm = parameters.filter(p => (!p.startsWith("*"))).join(" ");
      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

      if (skillSearchTerm === "" || alias === "") {
         message.channel.send("ERROR: Invalid check command");
         return;
      }

      message.author.send(utils.addCharacterSkillCheck(skillSearchTerm, alias));

   }

   //
   // Uncheck a skill for a character
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "removecheck ")) {

      var user = utils.getUser(message.author.id);
      if (user === undefined || !user.gm) { return; }

      var parameters = message.content.split(" ");
      parameters.shift();

      var skillSearchTerm = parameters.filter(p => (!p.startsWith("*"))).join(" ");
      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

      if (skillSearchTerm=== "" || alias === "") {
         message.channel.send("ERROR: Invalid check command");
         return;
      }

      message.author.send(utils.removeCharacterSkillCheck(skillSearchTerm, alias));

   }

   //
   // Uncheck all skills for a character
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "removechecks")) {

      var user = utils.getUser(message.author.id);
      if (user === undefined || !user.gm) { return; }

      var parameters = message.content.split(" ");
      parameters.shift();

      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

      if (alias === "") {
         message.channel.send("ERROR: Invalid check command");
         return;
      }

      message.author.send(utils.removeCharacterSkillChecks(alias));

   }

   //
   // List a character's check marked skills
   //
   if (message.content.toLowerCase().startsWith(commandPrefix + "mychecks")) {

      var parameters = message.content.split(" ");
      parameters.shift();

      var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");
      if (alias === "") { alias = undefined; }

      var r = utils.getCharacterChecks(message.author.id, alias);

      message.channel.send(r.error === undefined ? r.message : r.error);

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

