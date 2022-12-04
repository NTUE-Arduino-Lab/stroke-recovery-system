import ROUTE_PATH from './path';
import ROLES from './roles';
import { WARN, WARN_THRESHOLD } from './warn';

const VALID_MIN = 3; // pair id valid minutes

const COUNTDOWM_VALUE = 20; // 單位：秒，未使用

const GAME_LEVEL = {
    One: 'level1',
    Two: 'level2',
    Three: 'level3',
};

const COLOUR = {
    Red: '#ff70a7',
    Blue: '#70d6ff',
    Yellow: '#F6D735',
    Black: '#000000',
    Default: '#D9D9D9',
};

export {
    ROUTE_PATH,
    ROLES,
    VALID_MIN,
    WARN,
    WARN_THRESHOLD,
    COLOUR,
    COUNTDOWM_VALUE,
    GAME_LEVEL,
};
