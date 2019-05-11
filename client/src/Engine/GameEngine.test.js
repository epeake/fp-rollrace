import React from 'react';
import { mount, shallow } from 'enzyme';
import GameEngine from './GameEngine';
import App from '../App.js';
//import ChangeKeyMenu from './menus/ChangeKeyMenu.js';
import Timer from './Timer.js';
//import Map from './Map.js';
//import Tutorial from './Tutorial.js';
//import GameOverMenu from './menus/GameOverMenu.js';
//import PauseMenu from './menus/PauseMenu.js';
import { gameEngineProps } from '../setupTests';
import { CONSTANTS } from './Helpers/constants';

// const MAP = [
//   'm 0, 650 h 359 v -180 h 159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
// ];

describe('GameEngine Tests', () => {
  /*  need these constants for these tests to apply
            const JUMP_POWER = 0.7; // jumping velocity
            const SCROLL_SPEED = 0.4;
            const SPRITE_SIDE = 50;
            const PATH_THRESH = 5;
            x: 200,
        that's where the random constants come from (a working configuration)
    */
  describe('Tests different scenarios findNextChange()', () => {
    let gameEngine;
    let menuCallback;
    let updateGuestStatsCallback;
    beforeAll(() => {
      // create mock new Date().getTime()
      const mockedDate = new Date(2017, 11, 10);
      const originalDate = Date;
      global.Date = jest.fn(() => mockedDate);
      global.Date.setDate = originalDate.setDate;
    });
    afterAll(() => {
      // probably need to add something here to make sure that
      // new Date().getTime() isn't permanently messed up but idk
    });
    beforeEach(() => {
      menuCallback = jest.fn();
      updateGuestStatsCallback = jest.fn();
      gameEngine = shallow(
        <GameEngine
          mapProps={Object.assign(
            {},
            {
              map: gameEngineProps.map,
              strokeWidth: gameEngineProps.strokeWidth
            }
          )}
          goToMenu={menuCallback}
          multi={gameEngineProps.multi}
          playercolor={gameEngineProps.playercolor}
          updateGuestStats={updateGuestStatsCallback}
          playerName={gameEngineProps.playerName}
          mode={gameEngineProps.mode}
        />
      );
      gameEngine.instance().variables.gameStartTime = new Date().getTime();
      gameEngine.instance().variables.mapTranslationStartTime = new Date().getTime();
    });
    test('does nothing when stuck in corner', () => {
      gameEngine.update();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.STOP;
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('nothing');
      expect(motionChange.time).toBeFalsy();
    });
    test('finds wall while on flat', () => {
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('block');
      expect(motionChange.time).toBeTruthy();
    });
    test('finds end of path while on flat', () => {
      gameEngine.instance().variables.yStart =
        gameEngine.instance().variables.yStart - 180;
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation - 160;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().state.mapTranslation - 160,
        y: gameEngine.instance().state.y - 180
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('fall');
      expect(motionChange.time).toBeTruthy();
    });
    test('goes when jumps over wall', () => {
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.UP;
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation +
        gameEngine.instance().variables.x -
        650 +
        CONSTANTS.SPRITE_SIDE;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().variables.mapTranslationStart
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('go');
      expect(motionChange.time).toBeTruthy();
    });
    test('lands when falls at wall', () => {
      gameEngine.instance().variables.descentStartTime = new Date().getTime();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.DOWN;
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation +
        gameEngine.instance().variables.x -
        650 +
        CONSTANTS.SPRITE_SIDE;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().variables.mapTranslationStart
      });

      gameEngine.instance().variables.yStart =
        gameEngine.instance().variables.yStart - 100;
      gameEngine.instance().setState({
        y: gameEngine.instance().state.y - 100
      });

      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('land');
      expect(motionChange.time).toBeTruthy();
    });
    test('falls when jumps at wall', () => {
      CONSTANTS.JUMP_POWER = 0.2;

      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.atWall = true;
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.UP;
      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation +
        gameEngine.instance().variables.x -
        650 +
        CONSTANTS.SPRITE_SIDE;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().variables.mapTranslationStart
      });

      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('fall');
      expect(motionChange.time).toBeTruthy();
      CONSTANTS.JUMP_POWER = 0.7; // reset
    });
    test('lands while falling', () => {
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.DOWN;
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 5;
      gameEngine.instance().variables.descentStartTime = new Date().getTime();
      gameEngine.instance().setState({
        y: gameEngine.instance().variables.yStart
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('land');
      expect(motionChange.time).toBeTruthy();
    });
    // test('lands while falling on corner', () => {
    //   gameEngine.instance().variables.jumpState = 2; // CONSTANTS.jump.DOWN
    //   gameEngine.instance().variables.yStart =
    //     gameEngine.instance().state.y - 191;
    //   gameEngine.instance().variables.descentStartTime = new Date().getTime();
    //   gameEngine
    //     .instance()
    //     .setState({ y: gameEngine.instance().variables.yStart });
    //   gameEngine.update();
    //   const motionChange = gameEngine.instance().findNextChange({
    //     variables: gameEngine.instance().variables,
    //     state: gameEngine.instance().state,
    //     strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
    //     map: gameEngine.instance().props.mapProps.map,
    //     mapLength: gameEngine.instance().mapLength
    //   });
    //   expect(motionChange).toEqual({
    //     time: new Date().getTime() + 146.7598, // a constant
    //     event: 'land'
    //   });
    // });
    test('blocks while falling', () => {
      gameEngine.instance().variables.descentStartTime = new Date().getTime();
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.DOWN;
      gameEngine.instance().variables.yStart =
        gameEngine.instance().variables.yStart - 100;
      gameEngine.instance().setState({
        y: gameEngine.instance().state.y - 100
      });

      gameEngine.instance().variables.mapTranslationStart =
        gameEngine.instance().state.mapTranslation +
        gameEngine.instance().variables.x -
        640 +
        CONSTANTS.SPRITE_SIDE;
      gameEngine.instance().setState({
        mapTranslation: gameEngine.instance().variables.mapTranslationStart
      });

      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('block');
      expect(motionChange.time).toBeTruthy();
    });
    test('blocks while jumping', () => {
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.UP;
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();

      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('block');
      expect(motionChange.time).toBeTruthy();
    });
    test('falls while jumping', () => {
      gameEngine.instance().variables.jumpState = CONSTANTS.jump.UP;
      gameEngine.instance().variables.jumpStartTime = new Date().getTime();
      gameEngine.instance().variables.yStart =
        gameEngine.instance().state.y - 100;
      gameEngine.instance().setState({
        y: gameEngine.instance().state.y - 100
      });
      gameEngine.update();
      const motionChange = gameEngine.instance().findNextChange({
        variables: gameEngine.instance().variables,
        state: gameEngine.instance().state,
        strokeWidth: gameEngine.instance().props.mapProps.strokeWidth,
        map: gameEngine.instance().hashedGameMap,
        mapLength: gameEngine.instance().mapLength
      });
      expect(motionChange.event).toEqual('fall');
      expect(motionChange.time).toBeTruthy();
    });
  });
  describe('Game Engine Menu Rendering Tests', () => {
    let app, game;

    beforeEach(async () => {
      app = mount(<App />);
      app.setState({ mode: 'game' });
      game = app.find(GameEngine);
    });

    test('Game exists', () => {
      expect(app).toContainExactlyOneMatchingElement(GameEngine);
    });

    test('Pause and icon exist', () => {
      expect(game).toContainExactlyOneMatchingElement(Timer);
      // expect(game).toContainExactlyOneMatchingElement('.tutorial');
      expect(game).toContainExactlyOneMatchingElement('.pauseButton');
    });

    test('Pause button and resume works', () => {
      const pauseButton = game.find('.pauseButton');
      expect(pauseButton).toExist();
      //jest.useFakeTimers();
      //setTimeout(() => {
      // function bull() {
      //
      // }

      // async function cb() {
      //   try {
      //     const none = await pauseButton.simulate('click');
      //     expect(game.state('paused')).toBe(true);
      //   } catch (e) {
      //     console.log(e);
      //   }
      // }
      //
      // cb();

      // pauseButton.simulate('click');
      // expect(game.state('paused')).resolves.toBe(true);
      // const menu = game.find(PauseMenu);
      // expect(menu).toContainMatchingElements(2, '.resume');
      // const resume = menu.find(".resume");
      // resume.simulate('click');
      // expect(game).not.toContainExactlyOneMatchingElement(PauseMenu);
      // //}, 5000);
      //
      // jest.runAllTimers(3001);
      // jest.useRealTimers();
    });
  });
});
