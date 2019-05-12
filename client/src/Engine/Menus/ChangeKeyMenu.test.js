import React from 'react';
import ChangeKeyMenu from './ChangeKeyMenu.js';
import { mount } from 'enzyme';

describe('Change Key menu actions', () => {
  const goBack = jest.fn;
  const showModal = true;
  let comp;

  const docBody = document.querySelector('body');
  const map = {};
  docBody.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  beforeEach(() => {
    comp = mount(<ChangeKeyMenu goBack={goBack} showModal={showModal} />);
  });
  test('Contains a back button', () => {
    expect(comp.find('.back').exists()).toEqual(true);
  });

  test('Menu changes jumpkey on keypress', () => {
    map.keypress({ key: 'Space' });
    expect(comp.goBack).toHaveBeenCalled();
    expect(comp).toHaveState('jumpkey', 32);
  });
});
