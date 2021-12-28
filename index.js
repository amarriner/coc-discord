const bot = require("./bot.js");
const config = require("./config.json");
const discord = require("discord.js");
const fs = require("fs")
const utils = require("./utils.js");

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commandPrefix = config.commandPrefix;

// https://discordjs.guide/creating-your-bot/command-handling.html#reading-command-files
bot.client.commands = new discord.Collection();
var commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    bot.client.commands.set(command.data.name, command);
    commands.push(command.data);
}

const rest = new REST({ version: '9' }).setToken(config.botToken);

rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands.map(command => command.toJSON()) })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);

bot.client.once('ready', () => {

    utils.loadDataFiles();
    bot.client.user.setActivity(" Great Cthulhu rise from the depths ", { type: "WATCHING" });
    console.log('I am ready!');

});

bot.client.on('interactionCreate', async interaction => {

    if (interaction.isCommand()) {

        const command = bot.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }

    else {
        console.log(interaction);
    }

});

bot.client.on("messageCreate", message => {

    //
    // This will attempt to upgrade a character's skill and uncheck it either way
    //
    if (message.content.toLowerCase().startsWith(commandPrefix + "upgrademy")) {

        var parameters = message.content.split(" ");
        parameters.shift();

        var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+") && !p.startsWith("-"))).join(" ");

        var dice = 1;
        var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");
        if (alias === "") {
            alias = utils.getCharacter(message.author.id, undefined).rodbotAlias;
        }

        var r = utils.getCharacterStat(message.author.id, stat, alias);
        var title;
        var value;
        var intValue;
        var checked;

        if (r.error !== undefined) {
            message.channel.send(r.error);
            return;
        }

        else if (r.skillObjects !== undefined && r.skillObjects.length === 1) {
            title = r.skillObjects[0].name;
            value = r.skillObjects[0].value;
            intValue = r.skillObjects[0].intValue;
            checked = r.skillObjects[0].checked !== undefined ? r.skillObjects[0].checked : false;
        }

        else {
            message.channel.send("ERROR: Either more than one or zero skills found for " + stat);
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
        message.channel.send({ embeds: [r.message] });

    }


    //
    // Update a character's attribute or skill
    //
    else if (message.content.toLowerCase().startsWith(commandPrefix + "set")) {

        var user = utils.getUser(message.author.id);
        if (user === undefined || !user.gm) { return; }

        var parameters = message.content.split(" ");
        parameters.shift();

        var stat = parameters.filter(p => (!p.startsWith("*") && !p.startsWith("+") && !p.startsWith("-") && !p.startsWith("="))).join(" ");
        var value = parameters.filter(p => (p.startsWith("+") || p.startsWith("-") || p.startsWith("="))).join().replace(/^[+-=]/, "");
        var action = parameters.filter(p => (p.startsWith("+") || p.startsWith("-") || p.startsWith("="))).join().charAt(0);
        var alias = parameters.filter(p => (p.startsWith("*"))).join().replace(/^\*/, "");

        if (stat === "" || value === "" || alias === "") {
            message.channel.send("ERROR: Invalid set command");
            return;
        }

        message.channel.send({ embeds: [utils.updateCharacterStat(stat, parseInt(value), alias, action)] });

    }


    //
    // Reload JSON files from disk
    //
    else if (message.content.toLowerCase().startsWith(commandPrefix + "reload")) {

        var user = utils.getUser(message.author.id);
        if (user !== undefined && user.gm) {
            utils.loadDataFiles();
        }

    }

    //
    // Save data objects out to disk as JSON
    //
    else if (message.content.toLowerCase().startsWith(commandPrefix + "save")) {

        var user = utils.getUser(message.author.id);
        if (user !== undefined && user.gm) {
            utils.saveDataFiles();
        }

    }

    else {
        console.log(message);
    }
});

bot.client.login(config.botToken);

