import React from 'react';
import {
  getTimeForGivenY,
  getX,
  getY,
  getMapTranslation,
  findNextChange
} from './EngineFunctions.js';
import { gameEngineProps } from '.../setupTests';
import { CONSTANTS } from './constants.js';

describe('EngineFunction Tests', () => {
  describe('For given fuctions', () => {
    beforeAll(() => {
      const props = {
        // see constants.js
        yStart: 500,
        y: 600, // the y input used for ETA calculation
        descentStartTime: 0,
        jumpState: undefined,
        jumpStartTime: 0,
        currentTime: 100,
        mapTranslationStart: 0,
        mapTranslationStartTime: 0,
        atWall: false, // can't be true
        givenX: 200, // the x input used for ETA calculation
        x: 100 // this is the same x from CONSTANTS.variables.x
      };
    });
    test('getTimeForGivenY while jumping up', () => {
      props.jumpState = CONSTANTS.jump.UP;
      CONSTANTS.JUMP_SPEED = 10;
      CONSTANTS.JUMP_POWER = 100;
      expect(getTimeForGivenY(props)).toEqual(4);
    });
    test('getTimeForGivenY while falling', () => {
      props.jumpState = CONSTANTS.jump.DOWN;
      CONSTANTS.JUMP_SPEED = 10;
      expect(getTimeForGivenY(props)).toEqual(4);
    });
    test('getTimeForGivenX', () => {
      CONSTANTS.SCROLL_SPEED = 10;
      expect(getTimeForGivenY(props)).toEqual(4);
    });
  });
});
