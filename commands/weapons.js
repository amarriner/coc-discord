//
// Display character's weapons
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

utils.loadDataFiles();
command = new SlashCommandBuilder()
    .setName('weapons')
    .setDescription("Displays a character's weapons")
    .addStringOption(option => {
        option.setName('alias')
            .setDescription('The alias of the character get the weapons for')
            .setRequired(false)

            utils.getCharacterAliases().forEach(function(item) {
               option.addChoice(item.name, item.alias)
            })
            return option
    }
);


module.exports = {

    data: command,
    async execute(interaction) {

        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var r = utils.getCharacterWeapons(interaction.user.id, alias);

        await interaction.reply(r.error === undefined ? { embeds: [r.embed] } : r.error);

    }
};