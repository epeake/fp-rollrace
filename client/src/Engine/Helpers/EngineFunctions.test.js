import {
  getTimeForGivenY,
  getTimeForGivenX,
  getX,
  getY,
  getMapTranslation
} from './EngineFunctions.js';
import { CONSTANTS } from './constants.js';

describe('EngineFunction Tests', () => {
  describe('For given fuctions', () => {
    const props = {
      // see constants.js
      yStart: 500,
      descentStartTime: 0,
      jumpState: undefined,
      jumpStartTime: 0,
      mapTranslationStart: 0,
      mapTranslationStartTime: 0,
      atWall: false, // can't be true
      givenX: 300, // the x input used for ETA calculation
      x: 100 // this is the same x from CONSTANTS.variables.x
    };
    test('getTimeForGivenY while jumping up', () => {
      props.jumpState = CONSTANTS.jump.UP;
      props.y = 388;
      CONSTANTS.JUMP_SPEED = 6;
      CONSTANTS.JUMP_POWER = 40;
      expect(getTimeForGivenY(props)).toEqual(4); // (-40 +  sqrt(40^2 + 2 * 112 * -6)) / -6
    });
    test('getTimeForGivenY while falling', () => {
      props.y = 564;
      props.jumpState = CONSTANTS.jump.DOWN;
      CONSTANTS.JUMP_SPEED = 8;
      expect(getTimeForGivenY(props)).toEqual(4); // sqrt(2 * 8 * 64) / 8
    });
    test('getTimeForGivenX', () => {
      CONSTANTS.SCROLL_SPEED = 10;
      expect(getTimeForGivenX(props)).toEqual(20); // (200 - 100) / 10 = 20
    });
  });
  describe('Get functions', () => {
    const props = {
      currentTime: 4,
      mapTranslationStart: 0,
      mapTranslationStartTime: 0,
      mapTranslation: 200,
      x: 200,
      descentStartTime: 0,
      jumpStartTime: 0,
      yStart: 300,
      y: 400,
      paused: false
    };
    test('getMapTranslation while at wall', () => {
      props.atWall = true;
      expect(getMapTranslation(props)).toEqual(props.mapTranslation);
    });
    test('getMapTranslation whille not at wall', () => {
      props.atWall = false;
      CONSTANTS.SCROLL_SPEED = 10;
      expect(getMapTranslation(props)).toEqual(-40); // - 4 * 10
    });
    test('getX while at wall', () => {
      props.atWall = true;
      expect(getX(props)).toEqual(props.x - props.mapTranslation);
    });
    test('getX while not at wall', () => {
      props.atWall = false;
      CONSTANTS.SCROLL_SPEED = 10;
      expect(getX(props)).toEqual(240); // 4 * 10 + 200
    });
    test('getY while on flat', () => {
      props.jumpState = CONSTANTS.jump.STOP;
      expect(getY(props)).toEqual(props.y);
    });
    test('getY while falling', () => {
      props.jumpState = CONSTANTS.jump.DOWN;
      CONSTANTS.JUMP_SPEED = 8;
      expect(getY(props)).toEqual(364); // 4^2 * 8 * 0.5 + 300
    });
    test('getY while ascending', () => {
      props.jumpState = CONSTANTS.jump.UP;
      CONSTANTS.JUMP_SPEED = 6;
      CONSTANTS.JUMP_POWER = 40;
      expect(getY(props)).toEqual(188); // 300 - 40 * 4 + 0.5 * 6 * 4^2
    });
  });
});
