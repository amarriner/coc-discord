//
// This will randomly pick a player character and return its embed
//
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

utils.loadDataFiles();
command = new SlashCommandBuilder()
    .setName('random-character')
    .setDescription('Pick a random character');


module.exports = {

    data: command,
    async execute(interaction) {

        character = utils.getRandomPlayerCharacter();
        embed = utils.getCharacterEmbed(character);
        await interaction.reply({ embeds: [embed] });

    }
};
