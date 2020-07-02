const config = require("./config.json")
const discord = require("./discord");
const fs = require("fs");
const fuzzysort = require("fuzzysort");

var users;
var characters;
var skills;

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
   var skill = {
      name: undefined,
      description: undefined,
      value: undefined
   };

   var baseSkill = skills.filter(s => (s.name === skillKey));

   if (baseSkill.length) {
      skill.name = baseSkill[0].name;
      skill.description = baseSkill[0].description;
      skill.value = baseSkill[0].default;
   }

   if (character.skills !== undefined) {
      characterSkill = character.skills.filter(s => (s.name === skillKey));

      if (characterSkill.length) {
         characterSkill = characterSkill[0];

         skill.value = characterSkill.value;

         if (characterSkill.description !== undefined) {
            skill.description = characterSkill.description;
         }     
      }
   }

   return skill;

}

const findCharacterSkillKeys = function(character, searchTerm) {

   var characterSkills = [];

   if (character.skills !== undefined) {
      characterSkills = fuzzysort.go(searchTerm, 
                                     character.skills.filter(s => (s.description !== undefined)), 
                                     {key: "description", threshold: -10000});

   }

   var baseSkills = fuzzysort.go(searchTerm, skills, {key: "description", threshold: -10000});
   return Array.from(new Set(baseSkills.concat(characterSkills).map(s => s.obj.name)));

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

const getCharacterByAlias = function(alias) {

   for (var discordId in characters) {
     for (var i = 0; i < characters[discordId].length; i++) {
        if (characters[discordId][i].rodbotAlias !== undefined && characters[discordId][i].rodbotAlias === alias) {
           return characters[discordId][i];
        }
     }
   }

   return undefined;

}

const getDiscordIdByAlias = function(alias) {

   for (var discordId in characters) {
     for (var i = 0; i < characters[discordId].length; i++) {
        if (characters[discordId][i].rodbotAlias !== undefined && characters[discordId][i].rodbotAlias === alias) {
           return discordId;
        }
     }
   }

   return undefined;

}

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
   returnObj.attributeValue = character.attributes[attribute];
   returnObj.attributeName = attribute;
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
         "name": getCharacterSkillDescription(character, skills[i]),
         "value": getCharacterSkillValue(character, skills[i]),
         "inline": true
      });
   }

   returnObj.message = embed;
   returnObj.skills = skills;
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

   var embed = new discord.MessageEmbed();

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
   //embed.footer = {
   //   "text": "Born: " + character.birthplace + " | Lives: " + character.residence
   //}

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

const loadDataFiles = function() {

   characters = JSON.parse(fs.readFileSync('characters.json'));
   skills = JSON.parse(fs.readFileSync('skills.json'));
   users = JSON.parse(fs.readFileSync('users.json'));

};

const saveDataFiles = function() {

   fs.writeFileSync('characters.json', JSON.stringify(characters, null, 4));
   fs.writeFileSync('skills.json', JSON.stringify(skills, null, 4));
   fs.writeFileSync('users.json', JSON.stringify(users, null, 4));

};

const getUsers = function() {
   return users;
};

const getUser = function(discordId) {
   if (users[discordId] === undefined) {
      return undefined;
   }

   return users[discordId];
};

const updateCharacterStat = function(stat, value, alias) {

   var r;
   var discordId = getDiscordIdByAlias(alias);
   if (discordId === undefined ) { return "ERROR: Invalid character " + alias; }

   var character = getCharacter(discordId, alias);
   if (character === undefined) { return "ERROR: Invalid character " + alias; }

   var attribute = getCharacterAttribute(discordId, stat, alias);
   var skill = findCharacterSkillKeys(discordId, stat, alias);

   if (attribute.error === undefined) {

      character.attributes[attribute.attributeName] = value;
      saveDataFiles();
      r = getCharacterAttribute(discordId, stat, alias);
      r.message.footer = { text: "Updated attribute " + r.attributeName + " to " + r.attributeValue };
      return r.message; 

   }
   else if (skill.length === 1) {

      if (character.skills !== undefined && character.skills.filter(s => (s.name === skill[0])).length === 1) {

         character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].value = value;      
         saveDataFiles();
         r = getCharacterSkill(discordId, stat, alias);
         r.message.footer = { text: "Updated skill " +  getCharacterSkillDescription(character, skill[0]) + " to " + value };
         return r.message;
      }

   }

   return "ERROR: Invalid attribute or skill " + stat + " for " + character.name;

};

const rollDice = function(numberOfTens = 1) {

   var results = [];
   var onesDie = Math.floor(Math.random() * 9);

   for (var i = 0; i < Math.abs(numberOfTens); i++) {
      var tensDie = (Math.floor(Math.random() * 9)) * 10;

      if (tensDie === 0 && onesDie === 0) {
         results.push(parseInt(100));
      }
      else {
         results.push(parseInt(tensDie) + parseInt(onesDie));
      }
   }

   results = results.sort(function(a, b) {
                             return a - b;
                          });

   if (numberOfTens < 0) {
      results = results.reverse();
   }

   return results;

};

module.exports = {

   getCharacter: getCharacter,
   getCharacterAttribute: getCharacterAttribute,
   getCharacterSheet: getCharacterSheet,
   getCharacterSkill: getCharacterSkill,
   getCharacterStat: getCharacterStat,
   getUsers: getUsers,
   getUser: getUser,
   loadDataFiles: loadDataFiles,
   saveDataFiles: saveDataFiles,
   rollDice: rollDice,
   updateCharacterStat: updateCharacterStat

};
