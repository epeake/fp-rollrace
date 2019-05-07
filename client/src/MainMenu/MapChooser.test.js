import React from 'react';
import MapChooser from './MapChooser.js';
import { mount } from 'enzyme';

const content = [
  {
    title: 'Map 1',
    level: 'Easy',
    image: 'https://placebeard.it/640/360'
  },
  {
    title: 'Map 2',
    level: 'Medium',
    image: 'https://placebeard.it/640/360'
  },
  {
    title: 'Map 3',
    level: 'Hard',
    image: 'https://placebeard.it/640/360'
  }
];

describe('MapChooser tests', () => {
  let comp = null;
  beforeEach(() => {
    comp = mount(<MapChooser />);
    comp.setState({ content: content });
  });

  test('Only right button visible at first map', () => {
    comp.setState({ currMap: 0 });
    expect(comp.find('.leftbutton').exists()).toEqual(false);
    expect(comp.find('.rightbutton').exists()).toEqual(true);
  });

  test('Only left button visible at last map', () => {
    comp.setState({ currMap: 2 });
    expect(comp.find('.leftbutton').exists()).toEqual(true);
    expect(comp.find('.rightbutton').exists()).toEqual(false);
  });

  test('Middle maps should contain both buttons', () => {
    comp.setState({ currMap: 1 });
    expect(comp.find('.leftbutton').exists()).toEqual(true);
    expect(comp.find('.rightbutton').exists()).toEqual(true);
  });

  test('Expect clicking on right arrow to properly change map', () => {
    comp.setState({ currMap: 1 });
    const rightButton = comp
      .find('.rightbutton')
      .filterWhere(n => n.name() === 'button');
    rightButton.simulate('click');
    expect(comp.state('currMap')).toEqual(2);
  });

  test('Expect clicking on left arrow to properly change map', () => {
    comp.setState({ currMap: 1 });
    const rightButton = comp
      .find('.leftbutton')
      .filterWhere(n => n.name() === 'button');
    rightButton.simulate('click');
    expect(comp.state('currMap')).toEqual(0);
  });
});
