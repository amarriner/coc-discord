const config = require("./config.json");
const discord = require("./discord.js");
const utils = require("./utils.js");


const commandPrefix = config.commandPrefix;

discord.client.on('ready', () => {
    console.log('I am ready!');
});

discord.client.on("message", message => {

   if (message.content.startsWith(commandPrefix + "attr")) {
      var [command, attribute, alias] = message.content.split(" ");
      console.log(utils.getCharacterAttribute(message.author.id, attribute));
      message.channel.send(utils.getCharacterAttribute(message.author.id, attribute, alias));
   }

});

discord.client.login(config.botToken);

