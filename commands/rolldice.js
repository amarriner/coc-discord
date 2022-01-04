//
// This will roll percentile dice against an attribute or skill
//

const Dice = require('dice-notation-js');
const utils = require('../utils.js');

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('rolldice')
    .setDescription('Rolls some dice')
    .addStringOption(option =>
        option.setName('dice')
            .setDescription('The dice notation to roll (e.g. 1d6+1)')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character to roll as')
            .setRequired(false));

module.exports = {

    data: command,
    async execute(interaction) {

        var dice = interaction.options.getString('dice');
        var alias = interaction.options.getString('alias');
        if (alias === null) {
            alias = undefined;
        }

        character = utils.getCharacter(interaction.user.id, alias);
        embed = utils.getCharacterEmbed(character);

        result = Dice.detailed(dice);
        embed.description = `Rolled ${dice} and got a ${result.result.toString()}`;
        embed.footer = {
            'text': `Individual dice: ${result.rolls.join(" ")} | Modifier: ${result.modifier.toString()}`
        };

        await interaction.reply({ embeds: [embed] });

    }
};
