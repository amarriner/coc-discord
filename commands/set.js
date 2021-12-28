//
// Update a character's attribute or skill
//

const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('set')
    .setDescription("Adjusts a character's stat or attribute")
    .addStringOption(option =>
        option.setName('stat')
            .setDescription('The stat to update')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('value')
            .setDescription('How to adjust the stat, + add, - minus, = set')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character update')
            .setRequired(true));


module.exports = {

    data: command,
    async execute(interaction) {

        var user = utils.getUser(interaction.user.id);
        if (user === undefined || !user.gm) {
            await interaction.reply("Only keepers can use this command");
            return;
        }

        var stat = interaction.options.getString("stat");
        var param = interaction.options.getString("value");
        var action = param.charAt(0);
        var value = param.replace(/^[+-=]/, "");
        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        var r = utils.updateCharacterStat(stat, parseInt(value), alias, action);

        await interaction.reply({ embeds: [r] });

    }
};
