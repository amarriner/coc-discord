const config = require("./config.json")
const discord = require("./discord");

const users = require("./users.json");
const characters = require("./characters.json");

const getCharacterAttribute = function(discordId, attribute, alias) {

   var character;
   for (var characterDiscordId in characters) {
      for (var i = 0; i < characters[characterDiscordId].length; i++) {
         if (
            (characterDiscordId === discordId && (alias === undefined || characters[characterDiscordId][i].rodbotAlias == alias)) ||
            (alias !== undefined && characters[characterDiscordId][i].rodbotAlias === alias && users[discordId].gm)
            ) {
            character = characters[characterDiscordId][i];
            break;
         }
      }
   }

   if (character === undefined) {
      return "ERROR: Invalid character or alias " + alias;
   }

   if (!character.attributes) {
      return "ERROR: " + character.name + " has no attributes";
   }

   if (character.attributes[attribute] === undefined) {
      return "ERROR: Invalid attribute " + attribute;
   }

   return "[" + character.name + "] " + attribute + ": " + character.attributes[attribute];

};

module.exports = {

   getCharacterAttribute: getCharacterAttribute

};
