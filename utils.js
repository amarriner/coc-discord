const bot = require("./bot.js");
const config = require("./config.json")
const Dice = require('dice-notation-js');
const fs = require("fs");
const fuzzysort = require("fuzzysort");

const { MessageEmbed } = require('discord.js');

var users;
var characters;
var skills;
var talents;
var weapons;

const dbb_table = [64, 84, 124, 164, 204, 284, 364, 444, 524];
const build_table = ['-2', '-1', '0', '+1', '+2', '+3', '+4', '+5', '+6'];
const damage_bonus_table = ['-2', '-1', '0', '1d4', '1d6', '2d6', '3d6', '4d6', '5d6'];

const getRandomPlayerCharacter = function() {
    var players = getPlayerCharacterAliases();
    var player = players[Math.floor(Math.random() * players.length)];
    return getCharacterByAlias(player.alias);
}

const getPlayerCharacterAliases = function() {
    var aliases = Array();
    for(discord_id in characters) {
        for(i in characters[discord_id]) {
            if(i == 0) {
                aliases.push({
                    'alias': characters[discord_id][i].rodbotAlias,
                    'name': characters[discord_id][i].name
                });
            }
        }
    }
    return aliases;
}

const getCharacterAliases = function() {
    var aliases = Array();
    for(discord_id in characters) {
        for(i in characters[discord_id]) {
            aliases.push({
                'alias': characters[discord_id][i].rodbotAlias,
                'name': characters[discord_id][i].name
            });
        }
    }
    return aliases;
}

const parseWeaponDamage = function(character, damage) {

    const dice_regex = /([0-9]+d[0-9]+)/g;
    const modification_regex = /([+-][0-9]+)/g;

    if (damage.search(/{db}/) >= 0) {
        db = calculateDamageBonus(character);
        damage = `${damage}${db}`;
    }

    dice = damage.match(dice_regex);

    modification = 0;
    modifications = damage.match(modification_regex);
    if (modifications !== null) {
        for (i = 0; i < modifications.length; i++) {
            modification += parseInt(modifications[i]);
        }
    }

    var str = dice.join("+");
    if (modification > 0) {
        str = `${str}+${modification.toString()}`;
    }
    if (modification < 0) {
        str = `${str}-${modification.toString()}`;
    }
    return {
        "dice": dice,
        "modification": modification,
        "str": str
    }
}

const getDbbTableIndex = function(value) {
    for (i = 0; i < dbb_table.length; i++) {
        if (value <= dbb_table[i]) {
            return i;
        }
    }
    return -1;
}

const calculateBuild = function(character) {

    return build_table[getDbbTableIndex(parseInt(character.attributes.STR) + parseInt(character.attributes.SIZ))];

}

const calculateDamageBonus = function(character) {

    return damage_bonus_table[getDbbTableIndex(parseInt(character.attributes.STR) + parseInt(character.attributes.SIZ))];

}

const getSkillByName = function(skillName) {

   for(var i in skills) {
      if (skills[i].name === skillName) {
         return skills[i];
      }
   }

   return undefined;

}

const getTalentByName = function(talentName) {

   for(var i in talents) {
      if (talents[i].name === talentName) {
         return talents[i]; 
      }
   }

   return undefined;

}

const getWeaponByName = function(weaponName) {

    for(var i in weapons) {
        if (weapons[i].name === weaponName) {
            return weapons[i];
        }
    }

    return undefined;
}

const getCharacterWeapons = function(discordId, alias) {

   var returnObj = {
      embed: undefined,
      error: undefined
   };

   var character = getCharacter(discordId, alias);

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character";
      return returnObj;
   }

   returnObj.embed = getCharacterEmbed(character);

   if (character.weapons !== undefined && character.weapons.length) {

      var sortedWeapons = character.weapons.sort((a, b) => (a > b) ? 1 : -1);
      
      for (var i in sortedWeapons) {
         var weapon = getWeaponByName(sortedWeapons[i]);
         var parsed = parseWeaponDamage(character, weapon.damage);
         var skill = getSkillByName(weapon.skill);
         var characterSkillValue = getCharacterSkillValue(character, skill.name);
         returnObj.embed.fields.push({
            "name": weapon.description,
            "value": `Damage: ${parsed.str}\nSkill: ${skill.description} [${characterSkillValue}]\nRange: ${weapon.range}`
         });
      }
   }

   return returnObj;

}
const getCharacterTalents = function(discordId, alias) {

   var returnObj = {
      embed: undefined,
      error: undefined
   };

   var character = getCharacter(discordId, alias);

   if (character === undefined) {
      returnObj.error = "ERROR: Invalid character";
      return returnObj;
   }

   returnObj.embed = getCharacterEmbed(character);

   if (character.talents !== undefined && character.talents.length) {

      var sortedTalents = character.talents.sort((a, b) => (a > b) ? 1 : -1);
      
      for (var i in sortedTalents) {
         returnObj.embed.fields.push({
            "name": getTalentByName(sortedTalents[i]).title,
            "value": getTalentByName(sortedTalents[i]).description
         });
      }
   }

   return returnObj;

}

const addCharacterSkillCheck = function(skillSearchTerm, alias) {

   var r;
   var discordId = getDiscordIdByAlias(alias);
   if (discordId === undefined ) { return "ERROR: Invalid character " + alias; }

   var character = getCharacter(discordId, alias);
   if (character === undefined) { return "ERROR: Invalid character " + alias; }

   var searchSkill = findCharacterSkillKeys(discordId, skillSearchTerm, alias);

   if (searchSkill.length === 1) {

      if (character.skills === undefined) { character.skills = []; }

      if (character.skills.filter(s => (s.name === searchSkill[0])).length === 0) {

         var skill = skills[skills.map(function(e) { return e.name; }).indexOf(searchSkill[0])];

         character.skills.push({
            name: skill.name,
            value: skill.default
         });
      }

      character.skills[character.skills.map(function(e) { return e.name; }).indexOf(searchSkill[0])].checked = true;
      saveDataFiles();
      r = getCharacterSkill(discordId, skillSearchTerm, alias);
      r.message.footer = { text: "Checked skill " +  getCharacterSkillDescription(character, searchSkill[0])};
      return r.message;

   }

   return "ERROR: Invalid skill " + skillSearchTerm + " for " + character.name;

}

const removeCharacterSkillCheck = function(skillSearchTerm, alias) {

   var r;
   var discordId = getDiscordIdByAlias(alias);
   if (discordId === undefined ) { return "ERROR: Invalid character " + alias; }

   var character = getCharacter(discordId, alias);
   if (character === undefined) { return "ERROR: Invalid character " + alias; }

   var skill = findCharacterSkillKeys(discordId, skillSearchTerm, alias);

   if (skill.length === 1) {

      if (character.skills === undefined) { character.skills = []; }

      if (character.skills.filter(s => (s.name === skill[0])).length === 0) {
         character.skills.push(skills[skill[0]]);
      }

      character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].checked = false;
      saveDataFiles();
      r = getCharacterSkill(discordId, skillSearchTerm, alias);
      r.message.footer = { text: "Unchecked skill " +  getCharacterSkillDescription(character, skill[0])};
      return r.message;

   }

   return "ERROR: Invalid skill " + skillSearchTerm + " for " + character.name;

};

const removeCharacterSkillChecks = function(alias) {

   var r;
   var discordId = getDiscordIdByAlias(alias);
   if (discordId === undefined ) { return "ERROR: Invalid character " + alias; }

   var character = getCharacter(discordId, alias);
   if (character === undefined) { return "ERROR: Invalid character " + alias; }

   if (character.skills !== undefined) {
      for (var i = 0; i < character.skills.length; i++) {
         if (character.skills[i].checked !== undefined && character.skills[i].checked) {
            character.skills[i].checked = false;
         }
      }
   }

   saveDataFiles();
   r = getCharacterEmbed(character);
   r.footer = { text: "Removed all character checks for " + character.name };
   return r;

}

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

         if (characterSkill.checked !== undefined) {
            skill.checked = characterSkill.checked;
         }

         if (characterSkill.description !== undefined) {
            skill.description = characterSkill.description;
         }     
      }
   }

   return skill;

}

const findWeaponKeys = function(searchTerm) {
    return fuzzysort.go(
                searchTerm,
                weapons.filter(w => (w.description !== undefined)),
                {key: "description", threshold: -10000});
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

};

const getCharacterByName = function(characterName) {

   for (var discordId in characters) {
     for (var i = 0; i < characters[discordId].length; i++) {
        if (characters[discordId][i].name !== undefined && characters[discordId][i].name === characterName) {
           return characters[discordId][i];
        }
     }
   }

   return undefined;

};

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

const getCharacterChecks = function(discordId, alias) {

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

   var emoji = getEmojiByName(config.skillCheckEmoji);
   var embed = getCharacterEmbed(character);
   checked = 0
   for (var s = 0; s < character.skills.length; s++) {
      if (character.skills[s].checked !== undefined && character.skills[s].checked) {
         embed.fields.push({
            "name": getCharacterSkillDescription(character, character.skills[s].name),
            "value": getCharacterSkillValue(character, character.skills[s].name) + (isCharacterSkillChecked(character, character.skills[s].name) ? " <:" + emoji.name + ":" + emoji.id + ">" : ""),
            "inline": true
         });
         checked += 1;
      }
   }

   if (checked === 0) {
       embed.footer = {
           "text": "No checks yet"
       }
   }

   returnObj.message = embed;
   return returnObj;

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
      "value": character.attributes[attribute].toString(),
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
   returnObj.skillObjects = [];
   for (var i = 0; i < skills.length; i++) {

      var emoji = getEmojiByName(config.skillCheckEmoji);
      var s = {
         "name": getCharacterSkillDescription(character, skills[i]),
         "value": getCharacterSkillValue(character, skills[i]).toString() + (isCharacterSkillChecked(character, skills[i]) ? " <:" + emoji.name + ":" + emoji.id + ">" : ""),
         "intValue": parseInt(getCharacterSkillValue(character, skills[i])),
         "checked": isCharacterSkillChecked(character, skills[i]),
         "inline": true
      };

      embed.fields.push(s);
      returnObj.skillObjects.push(s);
   
      if (i === 0) {   
         returnObj.author = {name: "", url: skills[i]};
      }
     
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

const isCharacterSkillChecked = function(character, skillsKey) {

   var skill = findCharacterSkill(character, skillsKey);
   return (skill.checked !== undefined ? skill.checked : false);

};

const getCharacterEmbed = function(character) {

   var embed = new MessageEmbed();

   embed.title = character.name;
   embed.url = character.sheet;
   embed.color = config.rollSuccessColor;
   //embed.author = {
   //   "name": config.authorName,
   //   "icon_url": config.authorIconUrl,
   //   "url": config.authorUrl
   //};
   embed.description = character.description;
   embed.thumbnail = {
      "url": character.avatar
   };
   //embed.footer = {
   //   "text": "Born: " + character.birthplace + " | Lives: " + character.residence
   //}

   embed.fields = [];
   
   return embed;
}

function compareByName(a, b) {
   return a.name.localeCompare(b.name);
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

   returnObj.embed = getCharacterEmbed(character);

   str = "";
   index = 0;
   title = "ATTRIBUTES";
   for (var attribute in character.attributes) {

      if (index == 0) {
         str = `${attribute.padEnd(4)}: ${character.attributes[attribute].toString().padStart(2)}`;
      }
      else if (index % 2 == 1) {
         str = `${str} | ${attribute.padEnd(4)}: ${character.attributes[attribute].toString().padStart(2)}`;
      }
      else {
         str = `${str}\n${attribute.padEnd(4)}: ${character.attributes[attribute].toString().padStart(2)}`
      }
      
      index++;

   }

   returnObj.embed.fields.push({
      "name": " ",
      "value": "```" + str + "```",
      "inline": false
   });

   str = "";
   title = "SKILLS";
   for (var s in character.skills.sort(compareByName)) {

      description = (character.skills[s].description !== undefined ? character.skills[s].description : getSkillByName(character.skills[s].name).description);
      value = character.skills[s].value.toString();
      if (character.skills[s].checked) {
         check = ` ${getEmojiByName(config.skillCheckEmoji)}`;
      }
      else {
         check = "";
      }

      returnObj.embed.fields.push({
         "name": description,
         "value": `${value}${check}`,
         "inline": true
      });
   }

   returnObj.embed.fields.push({
      "name": "Talents",
      "value": character.talents.map(talent => getTalentByName(talent).title).sort().join(", "),
      "inline": false
   });

   returnObj.embed.fields.push({
      "name": "Weapons",
      "value": character.weapons.map(weapon => getWeaponByName(weapon).description).sort().join(", "),
      "inline": false
   });

   return returnObj;

};

const loadDataFiles = function() {

   characters = JSON.parse(fs.readFileSync('characters.json'));
   skills = JSON.parse(fs.readFileSync('skills.json'));
   talents = JSON.parse(fs.readFileSync('talents.json'));
   weapons = JSON.parse(fs.readFileSync('weapons.json'));
   users = JSON.parse(fs.readFileSync('users.json'));

};

const saveDataFiles = function() {

   fs.writeFileSync('characters.json', JSON.stringify(characters, null, 4));
   fs.writeFileSync('skills.json', JSON.stringify(skills, null, 4));
   fs.writeFileSync('talents.json', JSON.stringify(talents, null, 4));
   fs.writeFileSync('users.json', JSON.stringify(users, null, 4));

};

const getEmojiByName = function(emojiName) {

   return bot.client.emojis.cache.find(e => e.name === emojiName);

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

const updateCharacterStat = function(stat, value, alias, action) {

   var r;
   var discordId = getDiscordIdByAlias(alias);
   if (discordId === undefined ) { return "ERROR: Invalid character " + alias; }

   var character = getCharacter(discordId, alias);
   if (character === undefined) { return "ERROR: Invalid character " + alias; }

   var attribute = getCharacterAttribute(discordId, stat, alias);
   var skill = findCharacterSkillKeys(discordId, stat, alias);

   if (attribute.error === undefined) {

      switch (action) {
         case "=":
            character.attributes[attribute.attributeName] = value;
            break;

         case "+":
            character.attributes[attribute.attributeName] += value;
            break;

         case "-":
            character.attributes[attribute.attributeName] -= value;
            break;

         default:
            character.attributes[attribute.attributeName] = value;
      }

      saveDataFiles();
      r = getCharacterAttribute(discordId, stat, alias);
      r.message.footer = { text: "Updated attribute " + r.attributeName + " to " + r.attributeValue };
      return r.message; 

   }
   else if (skill.length === 1) {

      if (! (character.skills !== undefined && character.skills.filter(s => (s.name === skill[0])).length === 1)) {

         var newSkill = skills[skills.map(function(e) { return e.name; }).indexOf(skill[0])];

         character.skills.push({
            name: newSkill.name,
            value: newSkill.default
         });

      }

      switch (action) {
         case "=":
            character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].value = value;      
            break;

         case "+":
            character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].value += value;
            break;

         case "-":
            character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].value -= value;
            break;
      }

      saveDataFiles();
      r = getCharacterSkill(discordId, stat, alias);
      r.message.footer = { text: "Updated skill " +  getCharacterSkillDescription(character, skill[0]) + " to " + character.skills[character.skills.map(function(e) { return e.name; }).indexOf(skill[0])].value };
      return r.message;

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

const rollDiceString = function(diceString) {

    const dice_regex = /\+?([0-9]+d[0-9]+)/g;
    const modification_regex = /([+-][0-9]+)/g;

    results = [];
    str = "";
    total = 0;
    dice = diceString.match(dice_regex);
    for (i = 0; i < dice.length; i++) {
        result = Dice.detailed(dice[i]);

        if (str === "") {
            str = dice[i];
        }
        else {
            str = `${str}+${dice[i].replaceAll(/\+/g, '')}`;
        }

        results.push(`(${result.rolls.join(", ")})`);
        total += result.result;
    }

    modification = 0;
    modifications = diceString.replaceAll(dice_regex, '').match(modification_regex);
    if (modifications !== null) {
        for (i = 0; i < modifications.length; i++) {
            modification += parseInt(modifications[i]);
        }
    }

    if (modification > 0) {
        str = `${str}+${modification.toString()}`;
        total += modification;
    }
    if (modification < 0) {
        str = `${str}-${modification.toString()}`;
        total -= modification;
    }
    return {
        "dice": dice,
        "modification": modification,
        "results": results,
        "str": str,
        "total": total
    }
}

module.exports = {

   addCharacterSkillCheck: addCharacterSkillCheck,
   calculateBuild: calculateBuild,
   calculateDamageBonus: calculateDamageBonus,
   findWeaponKeys: findWeaponKeys,
   getCharacter: getCharacter,
   getCharacterAliases: getCharacterAliases,
   getCharacterAttribute: getCharacterAttribute,
   getCharacterByAlias: getCharacterByAlias,
   getCharacterByName: getCharacterByName,
   getCharacterChecks: getCharacterChecks,
   getCharacterEmbed: getCharacterEmbed,
   getCharacterSheet: getCharacterSheet,
   getCharacterSkill: getCharacterSkill,
   getCharacterStat: getCharacterStat,
   getCharacterTalents: getCharacterTalents,
   getCharacterWeapons: getCharacterWeapons,
   getEmojiByName: getEmojiByName,
   getPlayerCharacterAliases: getPlayerCharacterAliases,
   getRandomPlayerCharacter: getRandomPlayerCharacter,
   getUsers: getUsers,
   getUser: getUser,
   getWeaponByName: getWeaponByName,
   loadDataFiles: loadDataFiles,
   parseWeaponDamage: parseWeaponDamage,
   saveDataFiles: saveDataFiles,
   removeCharacterSkillCheck: removeCharacterSkillCheck,
   removeCharacterSkillChecks: removeCharacterSkillChecks,
   rollDice: rollDice,
   rollDiceString: rollDiceString,
   updateCharacterStat: updateCharacterStat,
   characters: characters,
   weapons: weapons,
   talents: talents,
   skills: skills
};
