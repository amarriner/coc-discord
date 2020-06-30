const config = require("./config.json");
const discord = require("./discord.js");

const characters = require("./characters.json");
const users = require("./users.json");

const commandPrefix = "_";

discord.client.on('ready', () => {
    console.log('I am ready!');
});

discord.client.on("message", message => {

   if (message.content.startsWith(commandPrefix + "attr")) {
      var [command, attribute] = message.content.split(" ");
      console.log(command + " " + attribute + " " + message.author.id + " " + characters[message.author.id][0].attributes[attribute]);
   }

});

discord.client.login(config.botToken);

