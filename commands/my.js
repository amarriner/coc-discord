//
// This will look up attributes and/or skills and display them as a discord
// embed assuming if finds them
//
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('my')
    .setDescription('Returns the value of a skill or attribute')
    .addStringOption(option =>
        option.setName('stat')
            .setDescription('The skill or attribute to look up')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character get the skill or attribute from')
            .setRequired(false));


module.exports = {

    data: command,
    async execute(interaction) {

        var stat = interaction.options.getString("stat")
        var alias = interaction.options.getString("alias")
        if (alias === null) {
            alias = undefined
        }

        console.log(`Looking up ${stat} for ${alias} (${interaction.user.id})`)
        var r;

        for (var i = 0; i < stat.split(",").length; i++) {

            s = utils.getCharacterStat(interaction.user.id, stat.split(",")[i].trim(), alias);
            if (r === undefined) {
                r = s;
            }

            else if (s.error === undefined) {
                r.message.fields = r.message.fields.concat(s.message.fields);
            }

        }

        await interaction.reply({ embeds: [r.message] });
    }
};
