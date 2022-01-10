//
// Attempt to upgrade a character's skill
//

const config = require("../config.json");
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

utils.loadDataFiles();
command = new SlashCommandBuilder()
    .setName('upgrade')
    .setDescription("Attempts to upgrade a character's skill")
    .addStringOption(option =>
        option.setName('stat')
            .setDescription('The stat to upgrade')
            .setRequired(true))
    .addStringOption(option => {
        option.setName('alias')
            .setDescription('The alias of the character update')
            .setRequired(false)
            utils.getCharacterAliases().forEach(function(item) {
               option.addChoice(item.name, item.alias)
            })
            return option
    });


module.exports = {

    data: command,
    async execute(interaction) {

        var dice = 1;
        var stat = interaction.options.getString('stat');
        var alias = interaction.options.getString('alias');
        if (alias === null) {
            alias = utils.getCharacter(interaction.user.id, undefined).rodbotAlias;
        }

        var r = utils.getCharacterStat(interaction.user.id, stat, alias);
        var title;
        var value;
        var intValue;
        var checked;

        if (r.error !== undefined) {
            await interaction.reply(r.error);
            return;
        }

        else if (r.skillObjects !== undefined && r.skillObjects.length === 1) {
            title = r.skillObjects[0].name;
            value = r.skillObjects[0].value;
            intValue = r.skillObjects[0].intValue;
            checked = r.skillObjects[0].checked !== undefined ? r.skillObjects[0].checked : false;
        }

        else {
            await interaction.reply("ERROR: Either more than one or zero skills found for " + stat);
            return;
        }

        var diceRollResult = utils.rollDice(dice);
        var result = "Success (" + diceRollResult[0] + ")";

        if (!checked) {
            result = "No checkmark for " + title;
            r.message.color = config.rollFailureColor;
            r.message.description += "```Upgrading " + title + "```";
        }
        else if (intValue >= 90) {

            var currentSanity = utils.getCharacterStat(message.author.id, "SAN", alias)[0];
            var moreSanity = Math.floor(Math.random() * 6) + 1;
            moreSanity += Math.floor(Math.random() * 6) + 1;
            if (moreSanity > 99) { moreSanity = 99; }

            var cthulhuMythos = utils.getCharacterStat(message.author.id, "Cthulhu Mythos", alias)[0];
            if (moreSanity > cthulhuMythos.skillObjects[0].value) { moreSanity = cthulhuMythos.value; }

            utils.updateCharacterStat("SAN", currentSanity.attribute.value + moreSanity, alias, '=');
            r.message.description += "```Adding " + moreSanity + " to SAN because " + title + " is >= 90```";

        }
        else if (parseInt(parseInt(diceRollResult[0])) <= intValue) {
            result = "Failure (" + diceRollResult[0] + ")";
            r.message.color = config.rollFailureColor;
            r.message.description += "```Upgrading " + title + "```";
        }
        else {
            var upgradeAmount = Math.floor(Math.random() * 10) + 1;
            console.log(`${stat} ${intValue} ${upgradeAmount} ${alias}`);
            utils.updateCharacterStat(title, intValue + upgradeAmount, alias, '=')
            r.message.description += "```Adding " + upgradeAmount + " to " + title + " ```";
        }

        utils.removeCharacterSkillCheck(title, alias);

        r.message.footer = {};
        r.message.footer.text = result;
        r.message.footer.icon_url = (r.message.color === config.rollSuccessColor) ? config.rollSuccessUrl : config.rollFailureUrl;
        await interaction.reply({ embeds: [r.message] });
    }
};
