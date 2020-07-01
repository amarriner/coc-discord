const config = require("./config.json")
const discord = require("./discord");
const fuzzysort = require("fuzzysort");

const users = require("./users.json");
const characters = require("./characters.json");
const skills = require("./skills.json");

const findCharacterAttribute = function(character, searchTerm) {

   if (character.attributes === undefined) {
      return undefined;
   }

   for (var attribute in character.attributes) {
      if (attribute.toLowerCase().replace(" ", "") === searchTerm.toLowerCase().replace(" ", "")) {
         return attribute;
      }
   }

   return undefined;

};

const findCharacterSkill = function(character, skillKey) {

   var characterSkill;
   var skill;

   skill = skills.filter(s => (s.name === skillKey));

   if (!skill.length) {
      return undefined;
   }

   skill = skill[0];
   skill.value = skill.default;

   if (character.skills !== undefined) {
      characterSkill = character.skills.filter(s => (s.name === skillKey));

      if (characterSkill.length) {
         characterSkill = characterSkill[0];

         skill.value = characterSkill.value;

         if (characterSkill.description !== undefined) {
            skill.description = characterSkillDescription;
         }     
      }
   }

   return skill;

}

const findCharacterSkillKeys = function(character, searchTerm) {

   var characterSkills;

   if (character.skills !== undefined) {
      characterSkills = fuzzysort.go(searchTerm, 
                                     character.skills.filter(s => (s.description !== undefined)), 
                                     {key: "description", threshold: -10000});

      if (characterSkills.length) {
         return characterSkills;
      }
 
   }

   return fuzzysort.go(searchTerm, skills, {key: "description", threshold: -10000});

}    

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

};

const getCharacterStat = function(discordId, searchTerm, alias) {

   var character = getCharacter(discordId, alias);
   var returnObj = {
      error: undefined,
      message: undefined,
      value: undefined
   };

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character or alias " + alias;
      return returnObj;
   }

   attribute = getCharacterAttribute(discordId, searchTerm, alias);
   if (attribute.error === undefined) {
      return attribute;
   }

   return getCharacterSkill(discordId, searchTerm, alias);

}

const getCharacterAttribute = function(discordId, searchTerm, alias) {

   var character = getCharacter(discordId, alias);
   var returnObj = {
      error: undefined,
      message: undefined,
      value: undefined
   };

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character or alias " + alias;
      return returnObj;
   }

   if (!character.attributes) {
      returnObj.error = "ERROR: " + character.name + " has no attributes";
      return returnObj;
   }

   var attribute = findCharacterAttribute(character, searchTerm);

   if (attribute === undefined) {
      returnObj.error = "ERROR: Invalid attribute " + searchTerm;
      return returnObj;
   }

   var embed = getCharacterEmbed(character);
   embed.fields.push({
      "name": attribute,
      "value": character.attributes[attribute],
      "inline": true
   });

   returnObj.message = embed;
   returnObj.value = character.attributes[attribute];
   return returnObj;

};

const getCharacterSkill = function(discordId, searchTerm, alias) {

   var character = getCharacter(discordId, alias);
   var returnObj = {
      error: undefined,
      message: undefined,
      value: undefined
   };

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character or alias " + alias;
      return returnObj;
   }

   if (!character.skills) {
      returnObj.error = "ERROR: " + character.name + " has no skills";
      return returnObj;
   }

   var skills = findCharacterSkillKeys(character, searchTerm);

   if (! skills.length) {
      returnObj.error = "ERROR: Invalid skill " + searchTerm;
      return returnObj;
   }

   var embed = getCharacterEmbed(character);

   for (var i = 0; i < skills.length; i++) {
      embed.fields.push({
         "name": getCharacterSkillDescription(character, skills[i].obj.name),
         "value": getCharacterSkillValue(character, skills[i].obj.name),
         "inline": true
      });
   }

   returnObj.message = embed;
   return returnObj;

};

const getCharacterSkillDescription = function(character, skillsKey) {

   var skill = findCharacterSkill(character, skillsKey);
   return skill.description;

};

const getCharacterSkillValue = function(character, skillsKey) {

   var skill = findCharacterSkill(character, skillsKey);
   return skill.value;

};


const getCharacterEmbed = function(character) {

   var embed = new discord.RichEmbed();

   embed.title = character.name;
   embed.url = character.sheet;
   embed.color = 30750;
   embed.author = {
      //"name": character.name,
      // "icon_url": character.avatar,
      //"url": character.sheet
   };
   embed.description = character.description;
   embed.thumbnail = {
      "url": character.avatar
   };
   embed.footer = {
      "text": "Born: " + character.birthplace + " | Lives: " + character.residence
   }

   embed.fields = [];
   /*
   for (var attribute in character.attributes) {
      embed.fields.push({
         "name": attribute,
         "value": character.attributes[attribute],
         "inline": true
      });
   }
   */

   return embed;
}

const getCharacterSheet = function(discordId, alias) {

   var returnObj = {
      embed: undefined,
      error: undefined
   };

   var character = getCharacter(discordId, alias);

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character";
      return returnObj;
   }

   character.embed = getCharacterEmbed(discordId, alias);

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
   getCharacterSkill: getCharacterSkill,
   getCharacterStat: getCharacterStat,
   rollCharacterAttribute: rollCharacterAttribute

};
