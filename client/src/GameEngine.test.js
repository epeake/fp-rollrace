import React from 'react';
import { shallow, mount } from 'enzyme';

import GameEngine from './GameEngine';
import { mapProps } from './setupTests';

describe('GameEngine Tests', () => {
  /*  need these constants for these tests to apply
            const JUMP_POWER = 0.7; // jumping velocity
            const SCROLL_SPEED = 0.4;
            const SPRITE_SIDE = 100;
            const PATH_THRESH = 5;
        that's where the random constants come from (a working configuration)
    */
  describe('Tests different scenarios findNextChange()', () => {
    let gameEngine;
    beforeAll(() => {
      // create mock new Date().getTime()
      const mockedDate = new Date(2017, 11, 10);
      const originalDate = Date;
      global.Date = jest.fn(() => mockedDate);
      global.Date.setDate = originalDate.setDate;
    });
    afterAll(() => {
      // probably need to add something here to make sure that
      // new Date().getTime() isn't permanently messed up
    });
    beforeEach(() => {
      gameEngine = shallow(
        <GameEngine
          mapProps={Object.assign(
            {},
            { map: mapProps.map, strokeWidth: mapProps.strokeWidth }
          )}
        />
      );
      gameEngine.instance().variables.gameStartTime = new Date().getTime();
      gameEngine.instance().variables.mapTranslationStartTime = new Date().getTime();
    });
    test('finds wall while on flat', () => {
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 140,
        event: 'block'
      });
    });
    test('goes when jumps over wall', () => {
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = 1; // jump.UP
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation - 56;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().state.mapTranslation - 56
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 424.3662,
        event: 'go'
      });
    });
    test('lands when falls at wall', () => {
      gameEngine.instance().variables.descendStartTime = new Date().getTime();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = 2; // jump.DOWN
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 10;
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation - 56;
      gameEngine.instance().setState({
        y: gameEngine.instance().state.y - 10,
        mapTranslation: gameEngine.instance().state.mapTranslation - 56
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 124.0347,
        event: 'land'
      });
    });
    test('lands while falling', () => {
      gameEngine.instance().variables.jumpState = 2; // jump.DOWN
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 10;
      gameEngine.instance().variables.descendStartTime = new Date().getTime();
      gameEngine.instance().setState({ y: gameEngine.instance().state.y - 10 });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 124.0347,
        event: 'land'
      });
    });
    test('blocks while falling', () => {
      gameEngine.instance().variables.jumpState = 2; // jump.DOWN
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 20;
      gameEngine.instance().variables.descendStartTime = new Date().getTime();
      gameEngine.instance().setState({ y: gameEngine.instance().state.y - 20 });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 140,
        event: 'block'
      });
    });
    test('blocks while jumping', () => {
      gameEngine.instance().variables.jumpState = 1; // jump.UP
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.mapTranslationStart = gameEngine.instance().state.mapTranslation;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().state.mapTranslation
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 140,
        event: 'block'
      });
    });
    test('falls while jumping', () => {
      gameEngine.instance().variables.jumpState = 1; // jump.UP
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 100;
      gameEngine.instance().variables.mapTranslationStart = gameEngine.instance().state.mapTranslation;
      gameEngine.instance().setState({
        y: gameEngine.instance().state.y - 100,
        mapTranslation: gameEngine.instance().state.mapTranslation
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange();
      expect(motionChange).toEqual({
        time: new Date().getTime() + 538.4614,
        event: 'fall'
      });
    });
  });
});
