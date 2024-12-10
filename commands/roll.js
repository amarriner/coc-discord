//
// This will roll percentile dice against an attribute or skill
//

const config = require("../config.json");
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {

    utils.loadDataFiles();
    var command = new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a skill or attribute for a character')
        .addStringOption(option =>
            option.setName('stat')
                .setDescription('The skill or attribute to roll against')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('bonus')
                .setDescription('The number of bonus dice to roll')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('penalty')
                .setDescription('The number of penalty dice to roll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('A comment to add to the die roll')
                .setRequired(false))
        .addStringOption(option => {
            option.setName('alias')
                .setDescription('The alias of the character to roll for')
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

        // console.log(interaction.toString());

        var stat = interaction.options.getString('stat');
        var alias = interaction.options.getString("alias");
        if (alias === null) {
            alias = undefined;
        }

        var comment = "";
        if (interaction.options.getString("comment") !== null) {
            comment = "```" + interaction.options.getString("comment").substr(0, 2041) + "```";
        }

        var dice = 1;
        if (interaction.options.getInteger('bonus') !== null) {
            dice = 1 + interaction.options.getInteger('bonus');
        }
        if (interaction.options.getInteger('penalty') !== null) {
            dice = 1 - interaction.options.getInteger('penalty');
        }

        var r = utils.getCharacterStat(interaction.user.id, stat, alias, interaction.guild.id);
        var title;
        var value;

        if (r.error !== undefined) {
            await interaction.reply(r.error);
            return;
        }

        if (r.attributeValue) {
            title = r.attributeName;
            value = r.attributeValue.toString();
        }

        else if (r.skillObjects !== undefined && r.skillObjects.length === 1) {
            title = r.skillObjects[0].name;
            value = r.skillObjects[0].value.toString();
        }

        else {
            await interaction.reply("ERROR: Either more than one or zero skills found for " + stat);
            return;
        }

        var result = "Success"
        r.message.description += comment;
        var diceRollResult = utils.rollDice(dice);
        if (parseInt(parseInt(diceRollResult[0])) > parseInt(value)) {
            result = "Failure"
            r.message.color = config.rollFailureColor;
        }
        else if (diceRollResult[0] <= Math.floor(value / 5)) {
            result = "Extreme Success"
        }
        else if (diceRollResult[0] <= Math.floor(value / 2)) {
            result = "Hard Success"
        }
        r.message.footer = {};
        r.message.footer.text = result + " (" + ((diceRollResult.length > 1) ? diceRollResult.join(", ") : diceRollResult[0]) + ")";
        r.message.footer.icon_url = (parseInt(parseInt(diceRollResult[0])) <= parseInt(value)) ? config.rollSuccessUrl : config.rollFailureUrl;
        await interaction.reply({ embeds: [r.message], fetch: true });
        rollMessage = await interaction.fetchReply()
        filter = (reaction, user) => {
            return rollMessage.embeds !== undefined &&
                rollMessage.embeds.length === 1 &&
                rollMessage.embeds[0].footer.iconURL === config.rollSuccessUrl &&
                reaction._emoji.name === config.skillCheckEmoji &&
                utils.getUser(user.id).gm;
        };
        collector = rollMessage.createReactionCollector({ filter, time: 15000 });
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
            user.send({ embeds: [utils.addCharacterSkillCheck(rollMessage.embeds[0].fields[0].name, utils.getCharacterByName(rollMessage.embeds[0].title).rodbotAlias)] });
        });

    }

    return module;
};
