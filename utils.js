const config = require("./config.json")
const discord = require("./discord");

const users = require("./users.json");
const characters = require("./characters.json");

const getCharacterAttribute = function(discordId, attribute, alias) {

   if (characters[discordId] === undefined) {
      return "ERROR: Invalid discordId " + discordId;
   }

   var character;
   for (var i = 0; i < characters[discordId].length; i++) {
      if (alias === undefined || characters[discordId][i].rodbotAlias == alias) {
         character = characters[discordId][i];
         break;
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
