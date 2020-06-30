const config = require("./config.json");
const discord = require("./discord.js");

const characters = require("./characters.json");
const users = require("./users.json");

discord.client.on('ready', () => {
    console.log('I am ready!');
});

discord.client.on("message", message => {

   if (message.content.startsWith("!whatismy")) {
   }

});

discord.client.login(config.botToken);

