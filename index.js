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

    bot.client.guilds.cache.get(config.guildId).fetchWebhooks()
        .then(hooks => {
            botHooks = hooks.filter(hook => hook.owner.id === config.clientId)
            console.log(`This server has ${botHooks.size} coc-discord hooks`)
            for(let [id, hook] of botHooks) {
                console.log(`Deleting old hook ID ${id} ${JSON.stringify(hook)}`);
                hook.delete();
            }
        })
        .catch(console.error);

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

        utils.saveDataFiles();
    }

});

bot.client.on("messageCreate", message => {

    //
    // Reload JSON files from disk
    //
    if (message.content.toLowerCase().startsWith(commandPrefix + "reload")) {

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

});

bot.client.login(config.botToken);

