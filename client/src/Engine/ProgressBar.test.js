import React from 'react';
import { mount, shallow } from 'enzyme';
import ProgressBar from './ProgressBar.js';
import { CONSTANTS } from './Helpers/constants.js';

describe('Progress bar snapshot test', () => {
  let comp;
  test('progressBar snapshot', () => {
    comp = shallow(
      <ProgressBar x={CONSTANTS.TOOLBAR_X} y={CONSTANTS.TOOLBAR_Y} />
    );
    expect(comp).toMatchSnapshot();
  });
});

describe('Progress bar components test', () => {
  const x = 800;
  const y = 800;
  const currX = 300;
  const spriteColor = 'red';

  let comp;
  beforeEach(() => {
    comp = mount(
      <ProgressBar x={x} y={y} currX={currX} spriteColor={spriteColor} />
    );
  });

  test('Props testing', () => {
    expect(comp.props().x).toEqual(800);
    expect(comp.props().y).toEqual(800);
    expect(comp.props().currX).toEqual(300);
    expect(comp.props().spriteColor).toEqual('red');
  });

  test('Component has all elements rendered', () => {
    expect(comp.find('rect').exists()).toEqual(true);
    expect(comp.find('ellipse').exists()).toEqual(true);
  });
});
