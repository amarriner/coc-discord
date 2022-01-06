//
// This will attack as a character
//

const config = require("../config.json");
const Dice = require('dice-notation-js');
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

command = new SlashCommandBuilder()
    .setName('attack')
    .setDescription('Have a character make an attack')
    .addStringOption(option =>
        option.setName('weapon')
            .setDescription('The weapon to attack with, defaults to unarmed')
            .setRequired(false))
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
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('The alias of the character to attack with')
            .setRequired(false));

module.exports = {

    data: command,
    async execute(interaction) {

        var hasWeapon = false;
        var weapon = interaction.options.getString('weapon');
        if (weapon === null) {
            weapon = "unarmed"
            hasWeapon = true;
        }
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

        weapons = utils.findWeaponKeys(weapon);
        if (weapons.length === 0) {
            await interaction.reply(`ERROR: There is no weapon called ${weapon}`);
            return;
        }

        if (weapons.length !== 1) {
            await interaction.reply(`ERROR: There is more than one weapon for ${weapon}`);
            return;
        }

        var character = utils.getCharacter(interaction.user.id, alias);

        if (character.weapons !== undefined) {
            if (character.weapons.includes(weapons[0].obj.name)) {
                hasWeapon = true;
            }
        }
        if (!hasWeapon) {
            await interaction.reply(`ERROR: ${character.name} is not carrying a ${weapons[0].obj.description}`);
            return;
        }

        var r = utils.getCharacterStat(interaction.user.id, weapons[0].obj.skill, alias);
        var parsed = utils.parseWeaponDamage(character, weapons[0].obj.damage);
        r.message.fields.push({
            "name": "Weapon",
            "value": `${weapons[0].obj.description} (${parsed.str})`
        });
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

        if (result !== "Failure") {
            var damage = 0;
            var results = [];
            for (i = 0; i < parsed.dice.length; i++) {
                damageResult = Dice.detailed(parsed.dice[0]);
                damage += damageResult.result;
                results.push(damageResult.result);
            }
            var str = "";
            var mod = parsed.modification;
            if (mod > 0) { str = `+${mod}`; }
            if (mod < 0) { str = `-${mod}`; }
            r.message.fields.push({
                "name": "Damage",
                "value": `Rolled ${(damage + mod).toString()} (${results.join(", ")}${str})`
            });
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
};
