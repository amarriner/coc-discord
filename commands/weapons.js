//
// Display character's weapons
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {

    utils.loadDataFiles();
    var command = new SlashCommandBuilder()
        .setName('weapons')
        .setDescription("Displays a character's weapons")
        .addStringOption(option => {
            option.setName('alias')
                .setDescription('The alias of the character get the weapons for')
                .setRequired(false)

            utils.getCharacterAliases(guildId).forEach(function (item) {
                option.addChoice(item.name, item.alias)
            })
            return option
        });

    return command;
};


module.exports = function (guildId) {

    var module = {};

    module.data = buildCommand(guildId);
    module.execute = async function (interaction) {

        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var r = utils.getCharacterWeapons(interaction.user.id, alias, interaction.guild.id);

        await interaction.reply(r.error === undefined ? { embeds: [r.embed] } : r.error);

    }

    return module;
};
