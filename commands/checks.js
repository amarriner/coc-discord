//
// List a character's check marked skills
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('checks')
    .setDescription("Returns a character's checkmarks")
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character get the checkmarks for')
            .setRequired(false));


module.exports = {

    data: command,
    async execute(interaction) {

        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var r = utils.getCharacterChecks(interaction.user.id, alias);

        await interaction.reply(r.error === undefined ? { embeds: [r.message] } : r.error);

    }
};