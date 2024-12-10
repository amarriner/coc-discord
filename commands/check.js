//
// Check a skill for a character
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {

    utils.loadDataFiles();
    command = new SlashCommandBuilder()
        .setName('check')
        .setDescription("Add a skill check on a character")
        .addStringOption(option =>
            option.setName('stat')
                .setDescription('The skill to check')
                .setRequired(true))
        .addStringOption(option => {
            option.setName('alias')
                .setDescription('The alias of the character to add the checkmarks for')
                .setRequired(true)
            utils.getCharacterAliases(guildId).forEach(function (item) {
                option.addChoice(item.name, item.alias)
            })
            return option
        });

    return command;
}

module.exports = function (guildId) {

    var module = {};

    module.data = buildCommand(guildId)
    module.execute = async function (interaction) {

        var stat = interaction.options.getString("stat")
        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var user = utils.getUser(interaction.user.id, interaction.guild.id);
        if (user === undefined || !user.gm) {
            result = "Only keepers can use this command!"
        }
        else {
            result = utils.addCharacterSkillCheck(stat, alias, interaction.guild.id);
        }

        await interaction.reply(typeof result === "string" ? result : { embeds: [result] });

    }

    return module;
};
