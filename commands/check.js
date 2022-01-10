//
// Uncheck a skill for a character
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

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
            utils.getCharacterAliases().forEach(function(item) {
                option.addChoice(item.name, item.alias)
            })
            return option
    });

module.exports = {

    data: command,
    async execute(interaction) {

        var stat = interaction.options.getString("stat")
        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var user = utils.getUser(interaction.user.id);
        if (user === undefined || !user.gm) { 
            result = "Only keepers can use this command!"
        }
        else {
            result = utils.addCharacterSkillCheck(stat, alias);
        }

        await interaction.reply(typeof result === "string" ? result : { embeds: [result] });

    }
};
