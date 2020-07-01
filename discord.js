const discord = require("discord.js");

var client = new discord.Client();

var MessageEmbed = discord.MessageEmbed;

module.exports = {
    client: client,
    MessageEmbed: MessageEmbed
};
