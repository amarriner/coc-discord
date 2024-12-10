//
// This will roll percentile dice against an attribute or skill
//

const Dice = require('dice-notation-js');
const utils = require('../utils.js');

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {
    utils.loadDataFiles();
    var command = new SlashCommandBuilder()
        .setName('rolldice')
        .setDescription('Rolls some dice')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('The dice notation to roll (e.g. 1d6+1)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('A comment to add to the die roll')
                .setRequired(false))
        .addStringOption(option => {
            option.setName('alias')
                .setDescription('The alias of the character to roll as')
                .setRequired(false)
            utils.getCharacterAliases(guildId).forEach(function (item) {
                option.addChoice(item.name, item.alias)
            })
            return option
        });

    return command;
}

module.exports = function (guildId) {

    var module = {};

    module.data = buildCommand(guildId);
    module.execute = async function (interaction) {

        var dice = interaction.options.getString('dice');
        var alias = interaction.options.getString('alias');
        if (alias === null) {
            alias = undefined;
        }

        character = utils.getCharacter(interaction.user.id, alias, interaction.guild.id);
        embed = utils.getCharacterEmbed(character);

        result = utils.rollDiceString(dice);
        resultString = `Results: ${result.results.join(" + ")}`;
        if (result.modification != 0) {
            resultString = `${resultString} + ${result.modification}`;
        }
        embed.description = `Rolled ${dice} and got a ${result.total}`;
        if (interaction.options.getString("comment") !== null) {
            embed.description += "\n```" + interaction.options.getString("comment").substr(0, 2041) + "```";
        }
        embed.footer = {
            'text': `${resultString}`
        };

        await interaction.reply({ embeds: [embed] });

    }

    return module;
};
