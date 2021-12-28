const discord = require("discord.js");

// var client = new discord.Client({ intents: [discord.Intents.FLAGS.GUILDS] });
var client = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] });

module.exports = {
    client: client
};
