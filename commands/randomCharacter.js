//
// This will randomly pick a player character and return its embed
//
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {

    utils.loadDataFiles();
    var command = new SlashCommandBuilder()
        .setName('random-character')
        .setDescription('Pick a random character');

    return command;
}

module.exports = function(guildId) {

    var module = {};

    module.data = buildCommand(guildId);
    module.execute = async function(interaction) {

        character = utils.getRandomPlayerCharacter(interaction.guild.id);
        embed = utils.getCharacterEmbed(character);
        await interaction.reply({ embeds: [embed] });

    };

    return module;
};
