
let character_data = {};
let skill_data = {};
let talent_data = {};
let weapon_data = {};
let guild_data = {};

$(document).ready(function () {

    $('#character-select').on('change', function () {
        if (!$(this).children("option:selected").text().startsWith('Select')) {
            window.location.hash = `#${$(this).val()}`;
        }
    });

    let timestamp = Date.now();

    $.getJSON(`https://bulletriddenlich.com/coc/weapons.json?${timestamp}`, function (data) {
        weapon_data = data;
    });

    $.getJSON(`https://bulletriddenlich.com/coc/skills.json?${timestamp}`, function (data) {
        skill_data = data;
    });

    $.getJSON(`https://bulletriddenlich.com/coc/talents.json?${timestamp}`, function (data) {
        talent_data = data;
    });

    $.getJSON(`https://bulletriddenlich.com/coc/guilds.json?${timestamp}`, function (data) {
        guild_data = data;
    });

    $.getJSON(`https://bulletriddenlich.com/coc/characters.json?${timestamp}`, function (data) {

        character_data = data;
        // $('#character-select-card-loading').removeClass('visible').addClass('invisible');
        // $('#character-select-card-body').removeClass('invisible').addClass('visible');
        // $('#character-select').empty().append('<option>Select a character to view</option>');

        // for (id in character_data) {

        //     for (let i = 0; i < character_data[id].length; i++) {

        //         if (character_data[id][i].active_player) {

        //             let character = character_data[id][i];
        //             // console.log(character.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/[ ]/g, '-').toLowerCase());

        //             // console.log(character.name);
        //             $('#character-select').append(`<option value="${id}-${i}"> ${character.name}`);
        //         }
        //     }
        // }

        // var href = window.location.href;
        // if (href.split('#').length > 1) {

        //     let slug = href.split('#')[1];
        //     // console.log(slug);
        //     $('#character-select option').each(function() {

        //         $(this).prop('selected', false);

        //         if ($(this).val() == slug) {
        //             $(this).prop('selected', true);
        //             viewCharacterSheet();
        //         }

        //     });
        // }
        viewCharacterSheet();

    });
});

const viewCharacterSheet = function () {

    $('#character-sheet-body').removeClass('invisible').addClass('visible');

    // let slug = $('#character-select').children("option:selected").val();
    let slug = window.location.hash.replace('#', '');
    let id = slug.split('-')[0];
    let guildId = slug.split('-')[1]
    let index = slug.split('-')[2];

    $(document).prop('title', guild_data[guildId]);
    $('#guild').text(guild_data[guildId]);

    let character = character_data[id][guildId][index];
    $('#character-info').empty()
        .append(`
        <div class="d-flex align-items-center">
            <div class="col-sm-4 col-md-2">
                <em><img class="img-thumbnail" style="height: 5rem;" src="${character.avatar}" alt="${character.name}"></em>
            </div>
            <div class="col">
                <div class="col">
                    <strong>${character.name}</strong>
                </div>
                <div class="col">
                    ${character.description}
                </div>
                <div class="col">
                    <strong>Birthplace: </strong>
                    ${character.birthplace}
                </div>
                <div class="col">
                    <strong>Residence: </strong>
                    ${character.residence}
                </div>
            </div>
        </div>
        `);

    let count = 0;
    let attributes = "";
    let values = character.attributes;
    values.Build = calculateBuild(character);
    values.DMB = calculateDamageBonus(character);
    for (attribute in values) {

        stripe = "";
        if (count % 4 == 0 || count % 4 == 1) {
            stripe = " stripe"
        }

        attributes = `${attributes}<div class="col-sm-3${stripe}"><strong>${attribute}</strong></div><div class="col-sm-3${stripe}">${values[attribute]}</div>`;

        count++;

    }

    $('#character-attributes').empty()
        .append(`
            <div class="row">
                ${attributes}    
            </div>
        `);

    let skills = "";
    for (let i in character.skills) {

        let description = getSkill(character.skills[i].name).description;
        if (character.skills[i].description) {
            description = character.skills[i].description;
        }

        stripe = "";
        if (i % 2 == 1) {
            stripe = " stripe"
        }

        check = '<i class="fa fa-square-o" aria-hidden="true"></i>';
        if (character.skills[i].checked) {
            check = '<i class="fa fa-check-square-o" aria-hidden="true"></i>';
        }

        skills = `${skills}<div class="col-sm-9${stripe}"><strong>${check} ${description}</strong></div><div class="col-sm-3${stripe}">${character.skills[i].value}</div>`;

    }

    $('#character-skills').empty()
        .append(`
            <div class="row">
                ${skills}    
            </div>
        `);

    let talents = "";
    for (let j in character.talents) {

        talent = getTalent(character.talents[j]);
        talents = `${talents}<div><strong>${talent.title}</strong></div><div>${talent.description}</div>`;

    }

    if (!character.pulp) {
        $('#character-talents-header').remove();
        $('#character-talents').remove();
    }
    else {
        $('#character-talents').empty()
            .append(`
            <div class="row">
                ${talents}    
            </div>
        `);
    }

    if (!character.background) {
        $('#character-background-header').remove();
        $('#character-background').remove();
    }
    else {
        $('#character-background').text(character.background);
    }

    if (!character.equipment) {
        $('#character-equipment-header').remove();
        $('#character-equipment').remove();
    }
    else {
        $('#character-equipment').text(character.equipment);
    }
}

const getCharacterSlug = function (character) {
    return character.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/[ ]/g, '-').toLowerCase();
}

const getSkill = function (skill) {

    for (let i in skill_data) {
        if (skill_data[i].name == skill) {
            return skill_data[i];
        }
    }

    return {};

}

const getTalent = function (talent) {

    for (let i in talent_data) {
        if (talent_data[i].name == talent) {
            return talent_data[i];
        }
    }

    return {};

}

const dbb_table = [64, 84, 124, 164, 204, 284, 364, 444, 524];
const build_table = ['-2', '-1', '0', '+1', '+2', '+3', '+4', '+5', '+6'];
const damage_bonus_table = ['-2', '-1', '0', '1d4', '1d6', '2d6', '3d6', '4d6', '5d6'];

const getDbbTableIndex = function (value) {
    for (i = 0; i < dbb_table.length; i++) {
        if (value <= dbb_table[i]) {
            return i;
        }
    }
    return -1;
}

const calculateBuild = function (character) {

    return build_table[getDbbTableIndex(parseInt(character.attributes.STR) + parseInt(character.attributes.SIZ))];

}

const calculateDamageBonus = function (character) {

    return damage_bonus_table[getDbbTableIndex(parseInt(character.attributes.STR) + parseInt(character.attributes.SIZ))];

}

const toast = function (id) {

    // console.log(id);
    const toastTrigger = document.getElementById(id)
    const toastLiveExample = document.getElementById('liveToast')

    if (toastTrigger) {
        skill = getSkill(id);
        $('toast-header-text').empty().append(`<strong>${skill.name}</strong>`);
        $('toast-body').empty().append(skill.description)
        const toast = new bootstrap.Toast(toastLiveExample)
        toast.show()
    }

}
