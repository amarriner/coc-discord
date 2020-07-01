const config = require("./config.json")
const discord = require("./discord");

const users = require("./users.json");
const characters = require("./characters.json");

const getCharacter = function(discordId, alias) {

   for (var characterDiscordId in characters) {
      for (var i = 0; i < characters[characterDiscordId].length; i++) {
         if (
            (characterDiscordId === discordId && (alias === undefined || characters[characterDiscordId][i].rodbotAlias == alias)) ||
            (alias !== undefined && characters[characterDiscordId][i].rodbotAlias === alias && users[discordId].gm)
            ) {
            return characters[characterDiscordId][i];
         }
      }
   }

   return undefined;

}

const getCharacterAttribute = function(discordId, attribute, alias) {

   var character = getCharacter(discordId, alias);

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character or alias " + alias;
      return returnObj;
   }

   var returnObj = {
      error: undefined,
      message: undefined,
      value: undefined
   };

   if (!character.attributes) {
      returnObj.error = "ERROR: " + character.name + " has no attributes";
      return returnObj;
   }

   if (character.attributes[attribute] === undefined) {
      returnObj.error = "ERROR: Invalid attribute " + attribute;
      return returnObj;
   }

   returnObj.message = "[" + character.name + "] " + attribute + ": " + character.attributes[attribute];
   returnObj.value = character.attributes[attribute];
   return returnObj;

};

const getCharacterSheet = function(discordId, alias) {

   var returnObj = {
      embed: new discord.RichEmbed(),
      error: undefined
   };

   var character = getCharacter(discordId, alias);

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character";
      return returnObj;
   }

   returnObj.embed.title = character.name;
   returnObj.embed.url = character.sheet;
   returnObj.embed.author = {
      //"name": character.name,
      // "icon_url": character.avatar,
      //"url": character.sheet
   };
   returnObj.embed.description = character.description;
   returnObj.embed.thumbnail = {
      "url": character.avatar
   };
   //returnObj.embed.footer = {
   //   "text": "Born: " + character.birthplace + " | Lives: " + character.residence 
   //}

   return returnObj;

};

const rollCharacterAttribute = function(discordId, attribute, alias) {

   var r = getCharacterAttribute(discordId, attribute, alias);
   if (r.error !== undefined) {
      return r;
   }

   var character = getCharacter(discordId, alias);
   r.message = "/npc " + character.rodbotAlias + " /roll 1d100 # " + attribute + " " + r.value;
   return r; 

};

module.exports = {

   getCharacter: getCharacter,
   getCharacterAttribute: getCharacterAttribute,
   getCharacterSheet: getCharacterSheet,
   rollCharacterAttribute: rollCharacterAttribute

};
