const discord = require("discord.js");

var client = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] });

var MessageEmbed = discord.MessageEmbed;

module.exports = {
    client: client,
    MessageEmbed: MessageEmbed
};
