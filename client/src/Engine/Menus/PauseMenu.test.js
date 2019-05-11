import React from 'react';
import PauseMenu from './PauseMenu.js';
import { mount } from 'enzyme';

describe('Pause Menu tests', () => {
  const goToMenu = jest.fn();
  const restart = jest.fn();
  const changeKey = jest.fn();
  const resume = jest.fn();
  const showModal = true;
  let comp;
  beforeEach(() => {
    comp = mount(
      <PauseMenu
        goToMenu={goToMenu}
        restart={restart}
        changeKey={changeKey}
        resume={resume}
        showModal={showModal}
      />
    );
  });

  test('Modal pause menu contains necessary buttons', () => {
    expect(comp.find('.resume').exists()).toEqual(true);
    expect(comp.find('.restart').exists()).toEqual(true);
    expect(comp.find('.changeKey').exists()).toEqual(true);
    expect(comp.find('.goToMenu').exists()).toEqual(true);
  });

  test('Clicking on resume calls on correct callback function', () => {
    const resumeButton = comp
      .find('.resume')
      .filterWhere(n => n.name() === 'button');
    resumeButton.simulate('click');
    expect(resume).toHaveBeenCalledTimes(1);
  });
  test('Clicking on restart calls on correct callback function', () => {
    const restartButton = comp
      .find('.restart')
      .filterWhere(n => n.name() === 'button');
    restartButton.simulate('click');
    expect(restart).toHaveBeenCalledTimes(1);
  });
  test('Clicking on changeKey calls on correct callback function', () => {
    const changeKeyButton = comp
      .find('.changeKey')
      .filterWhere(n => n.name() === 'button');
    changeKeyButton.simulate('click');
    expect(changeKey).toHaveBeenCalledTimes(1);
  });
  test('Clicking on goToMenu calls on correct callback function', () => {
    const goToMenuButton = comp
      .find('.goToMenu')
      .filterWhere(n => n.name() === 'button');
    goToMenuButton.simulate('click');
    expect(goToMenu).toHaveBeenCalledTimes(1);
  });
});
