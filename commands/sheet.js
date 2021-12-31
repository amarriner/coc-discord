//
// Display character sheet
// This is mostly obsolete since the other actions also display the same 
// information or more
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('sheet')
    .setDescription('Displays a character sheet')
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character get the sheet for')
            .setRequired(false));


module.exports = {

    data: command,
    async execute(interaction) {

        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var r = utils.getCharacterSheet(interaction.user.id, alias);

        await interaction.reply(r.error === undefined ? { embeds: [r.embed] } : r.error);

    }
};
