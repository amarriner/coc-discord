//
// Say something as a character
//
const utils = require("../utils.js");

const { SlashCommandBuilder } = require('@discordjs/builders');

const buildCommand = function (guildId) {

    utils.loadDataFiles();
    var command = new SlashCommandBuilder()
        .setName('say')
        .setDescription('Say something as your character/NPC')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send as your character/NPC')
                .setRequired(true))
        .addStringOption(option => {
            option.setName('alias')
                .setDescription('The alias of the character to roll for')
                .setRequired(false)
            utils.getCharacterAliases(guildId).forEach(function (item) {
                option.addChoice(item.name, item.alias)
            })
            return option
        });
    // .addStringOption(option =>
    //     option.setName('alias')
    //         .setDescription('The alias of the character to speak as')
    //         .setRequired(false));
    return command;
}

module.exports = function(guildId){

    var module = {};
    
    module.data = buildCommand(guildId);
    module.execute = async function(interaction) {

        var user = utils.getUser(interaction.user.id, interaction.guild.id);
        var message = interaction.options.getString("message")
        var alias = interaction.options.getString("alias")
        if (alias === null || !user.gm) {
            alias = undefined
        }

        await interaction.reply({ content: 'Sending message...' });
        await interaction.deleteReply();

        // console.log("---> " + Object.keys(interaction.channel))
        // console.log("---> " + interaction.channel.type)
        // console.log("---> " + typeof(interaction.channel))
        character = utils.getCharacter(interaction.user.id, alias, interaction.guild.id);

        if (interaction.channel.type === 'GUILD_PUBLIC_THREAD') {

            interaction.guild.channels.fetch(interaction.channel.parentId)
                .then(channel => {
                    // console.log(`The channel name is: ${channel.name} and ${interaction.parentId} and ${channel.id}`)
                    // console.log("---> " + Object.keys(channel))
                    // console.log("---> " + typeof(channel))
                    c = interaction.guild.channels.resolve(channel);
                    console.log(character.avatar);
                    interaction.guild.channels.createWebhook(channel, character.name, {
                        avatar: character.avatar,
                    })
                        .then(async webhook => {
                            await webhook.send({
                                content: message,
                                threadId: interaction.channel.id
                            });
                            await webhook.delete();
                        })
                })

        }
        else {
            console.log(character.avatar);
            interaction.channel.createWebhook(character.name, {
                avatar: character.avatar,
            })
                .then(async webhook => {
                    await webhook.send({
                        content: message
                    });
                    await webhook.delete();
                })
                .catch(console.error);
        }
    }

    return module;
};
