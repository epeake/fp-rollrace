import React from 'react';
import GameOverMenu from './GameoverMenu.js';
import { shallow, mount } from 'enzyme';

describe('Game over menu tests', () => {
  const score = 0;
  const restart = jest.fn();
  const exitToMenu = jest.fn();
  const showModal = true;
  let comp;

  //snapshot for reference
  describe('Change Key menu snapshot test', () => {
    test('progressBar snapshot', () => {
      comp = shallow(
        <GameOverMenu
          score={score}
          restart={restart}
          exitToMenu={exitToMenu}
          showModal={showModal}
        />
      );
      expect(comp).toMatchSnapshot();
    });
  });

  describe('Game over menu functionality tests', () => {
    beforeEach(() => {
      comp = mount(
        <GameOverMenu
          score={score}
          restart={restart}
          exitToMenu={exitToMenu}
          showModal={showModal}
        />
      );
    });

    test('Props testing', () => {
      expect(comp.props().score).toEqual(0);
      expect(comp.props().showModal).toEqual(true);
    });

    test('Model Components are in place', () => {
      expect(comp.find('.modalprovider').exists()).toEqual(true);
      expect(comp.find('.styledmodal').exists()).toEqual(true);
      expect(comp.find('.prompt').exists()).toEqual(true);
      expect(comp.find('.score').exists()).toEqual(true);
      expect(comp.find('.highscore').exists()).toEqual(true);
    });

    test('Modal pause menu contains necessary buttons', () => {
      expect(comp.find('.restart').exists()).toEqual(true);
      expect(comp.find('.goToMenu').exists()).toEqual(true);
    });

    test('Clicking restart button calls correct callback function', () => {
      const restartButton = comp
        .find('.restart')
        .filterWhere(n => n.name() === 'button');
      restartButton.simulate('click');
      expect(restart).toHaveBeenCalledTimes(1);
    });

    test('Clicking main menu button calls correct callback function', () => {
      const mainMenuButton = comp
        .find('.goToMenu')
        .filterWhere(n => n.name() === 'button');
      mainMenuButton.simulate('click');
      expect(exitToMenu).toHaveBeenCalledTimes(1);
    });
  });
});
