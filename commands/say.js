//
// Say something as a character
//
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something as your character/NPC')
    .addStringOption(option =>
        option.setName('message')
            .setDescription('The message you want to send as your character/NPC')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character to speak as')
            .setRequired(false));


module.exports = {

    data: command,
    async execute(interaction) {

        var user = utils.getUser(interaction.user.id);
        var message = interaction.options.getString("message")
        var alias = interaction.options.getString("alias")
        if (alias === null || !user.gm) {
            alias = undefined
        }

        await interaction.reply({ content: 'Sending message...' });
        await interaction.deleteReply();

        character = utils.getCharacter(interaction.user.id, alias);
        interaction.channel.createWebhook(character.name, {
            avatar: character.avatar,
        })
       .then(async webhook => {
            await webhook.send({
               content: message
            })
        await webhook.delete();
       })
      .catch(console.error);
    }
};
