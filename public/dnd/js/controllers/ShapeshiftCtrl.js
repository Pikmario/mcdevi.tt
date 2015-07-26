'use strict';

/* Controllers */

angular.module('dnd5e.controllers.shapeshift', ['ngSanitize']).controller('shapeshiftCtrl', ['$scope', '$sce', '$routeParams', '$http', function($scope, $sce, $routeParams, $http) {
    var password;
    $http.get('/check-session')
    .success(function(result) {
        if(result === false) {
            password = window.prompt('Please enter the password:');
        }
        $http.get('/creatures?password=' + password)
        .success(function(beasts) {
            $scope.beasts = beasts.map(function(beast) { return JSON.parse(beast.data); });
            $scope.beasts.push({
                name: 'Eldritch Knight',
                size: 1,
                cr: 4,
                ac: 18,
                hp: 52,
                speed: 30,
                swim: 0,
                flight: 0,
                type: 'humanoid',
                alignment: 'any',
                armor_class: '18 (plate)',
                hit_points: '52 (8d8+16)',
                speeds: '30 ft.',
                abilities: [16, 11, 14, 16, 11, 15],
                senses: [],
                perception_prof: 0,
                languages: ['any one language (usually Common)'],
                challenge: '4 (1100 XP)',
                properties: [{
                    name: 'Brave',
                    text: 'The eldritch knight has advantage on saving throws against being frightened.'
                }, {
                    name: 'Spellcasting',
                    text: 'The eldritch knight is a 3rd-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 13, +5 to hit with spell attacks). The eldritch knight knows the following wizard spells:<ul><li>Cantrips (at will): Ray of Frost, Light</li><li>1st Level (4 slots): Expeditious Retreat, Feather Fall, Magic Missile, Shield</li><li>2nd Level (2 slots): Mirror Image, Shatter</li></ul>'
                }],
                actions: [{
                    name: 'Multiattack',
                    text: 'The eldritch knight makes two melee attacks.'
                }, {
                    name: 'Greatsword',
                    text: '<i>Melee Weapon Attack:</i> +5 to hit, reach 5 ft., one target. <i>Hit:</i> 10 (2d6+3) slashing damage.'
                }, {
                    name: 'Heavy Crossbow',
                    text: '<i>Ranged Weapon Attack:</i> +2 to hit, range 100/400 ft., one target. <i>Hit:</i> 5 (1d10) piercing damage.'
                }, {
                    name: 'Leadership (Recharges after a Short or Long Rest)',
                    text: 'For 1 minute, the eldritch knight can utter a special command or warning whenever a nonhostile creature that it can see within 30 feet of it makes an attack roll or a saving throw. The creature can add a d4 to its roll provided it can hear and understand the eldritch knight. A creature can benefit from only one Leadership die at a time. This effect ends if the eldritch knight is incapacitated.'
                }],
                reactions: [{
                    name: 'Parry',
                    text: 'The eldritch knight adds 2 to its AC against one melee attack that would hit it. To do so, the eldritch knight must see the attacker and be wielding a melee weapon.'
                }]
            });
            $scope.min_cr = 0;
            $scope.max_cr = 6;
            $scope.swim = '2';
            $scope.flight = '2';
            $scope.elemental = '2';
            $scope.size = ['0.25','0.5','1','2','3'];
            $scope.enemy = {};
            $scope.enemy.ac = 14;
            $scope.enemy.attack = 6;
            $scope.enemy.dph = 10;

            $scope.filters = true;
            $scope.selected_creature = null;

            $scope.sort = 'name';
            $scope.sort_dir = false;

            $scope.recalculate_all_dpr = function() {
                $scope.beasts.forEach(function(beast) {
                    beast.dpr = $scope.dpr_calc(beast);
                    beast.survivability = $scope.survivability_calc(beast);
                });
            };

            $scope.dpr_calc = function(beast) {
                return Math.max(Math.min(((beast.attack + 20 - $scope.enemy.ac) / 20), 0.95), 0.05) * beast.damage * beast.attacks;
            };
            $scope.survivability_calc = function(beast) {
                return beast.hp / (Math.max(Math.min(((20 + $scope.enemy.attack - beast.ac) / 20), 0.95), 0.05) * $scope.enemy.dph);
            };

            $scope.beasts.forEach(function(beast) {
                beast.dpr = $scope.dpr_calc(beast);
                beast.survivability = $scope.survivability_calc(beast);
            });

            $scope.$watch('enemy.ac', function() {
                $scope.recalculate_all_dpr();
            });
            $scope.$watch('enemy.attack', function() {
                $scope.recalculate_all_dpr();
            });
            $scope.$watch('enemy.dph', function() {
                $scope.recalculate_all_dpr();
            });

            $scope.titles = [
                {title: 'Name', field: 'name'},
                {title: 'Size', field: 'size'},
                {title: 'CR', field: 'cr'},
                {title: 'AC', field: 'ac'},
                {title: 'HP', field: 'hp'},
                {title: 'Survivability', field: 'survivability', tooltip: "'Number of rounds this creature will survive against an enemy with specified attack/damage.'"},
                {title: 'Speed', field: 'speed'},
                {title: 'Swim', field: 'swim'},
                {title: 'Flight', field: 'flight'},
                {title: 'Attacks', field: 'attacks', tooltip: "'Number of attacks this creature can make per round.'"},
                {title: 'Modifier', field: 'attack'},
                {title: 'DPH', field: 'damage', tooltip: "'Average damage creature does on a hit.'"},
                {title: 'DPR', field: 'dpr', tooltip: "'Average damage per round against an enemy with specified AC.'"}
            ];

            $scope.sizes = {
                '0.25': 'Tiny',
                '0.5': 'Small',
                '1': 'Medium',
                '2': 'Large',
                '3': 'Huge'
            };

            $scope.crs = {
                '0': '0',
                '0.125': '1/8',
                '0.25': '1/4',
                '0.5': '1/2',
            };
            $scope.cr_options = [
                {name: '0', value: 0},
                {name: '1/8', value: 0.125},
                {name: '1/4', value: 0.25},
                {name: '1/2', value: 0.5},
            ];
            for(var i = 1; i < 7; i++) {
                $scope.crs[''+i] = ''+i;
                $scope.cr_options.push({name: i, value: i});
            }
        });
    });

    $scope.filterBeasts = function(beast) {
        if(
            beast.cr < $scope.min_cr ||
            beast.cr > $scope.max_cr ||
            beast.swim > 0 && $scope.swim == '0' ||
            beast.swim === 0 && $scope.swim == '1' ||
            beast.flight > 0 && $scope.flight == '0' ||
            beast.flight === 0 && $scope.flight == '1' ||
            beast.name.indexOf('Elemental') !== -1 && $scope.elemental == '0' ||
            beast.name.indexOf('Elemental') === -1 && $scope.elemental == '1' ||
            $scope.size.indexOf(''+beast.size) === -1 ||
            beast.name.indexOf('Elemental') !== -1 && $scope.elemental === false
        ) { return false; }
        return true;
    };

    $scope.evaluateBeast = function(beast) {
        return beast[$scope.sort];
    };

    $scope.re_sort = function(field) {
        $scope.sort_dir = ( $scope.sort == field ? !$scope.sort_dir : true );
        $scope.sort = field;
    };

    $scope.select_creature = function(index) {
        $scope.selected_creature = index;
    };
    $scope.deselect_creature = function(index) {
        $scope.selected_creature = null;
    };
    $scope.abilityText = function(score) {
        return [String(score),
            ' (',
            $scope.formattedModifier($scope.abilityModifier(score)),
            ')'].join('');
    };
    $scope.abilityModifier = function(score) {
        return Math.floor((score - 10)/2);
    };
    $scope.formattedModifier = function(modifier) {
        if (modifier >= 0) {
            return '+' + modifier;
        } else {
            return '–' + Math.abs(modifier);    
        }
      };
}]);
