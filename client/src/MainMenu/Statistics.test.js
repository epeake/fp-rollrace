import React from 'react';
import Statistics from './Statistics.js';
import { mount } from 'enzyme';

const content = [
  {
    mapId: 0,
    title: 'Lazy Hills',
    level: 'Easy',
    image: 'maps/easy.png',
    path: [
      'm 0, 650 h 359 v -180 h 159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
    ],
    end: 640,
    strokeWidth: 6,
    startTime: {
      minutes: '00',
      seconds: '30'
    }
  },
  {
    mapId: 1,
    title: 'Slippery When Wet',
    level: 'Medium',
    image: 'maps/medium.png',
    path: [
      'm 0, 650 h 640 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 160 v -160 h 160 v 160 h 640 v -1000 h 500'
    ],
    end: 620,
    strokeWidth: 6,
    startTime: {
      minutes: '00',
      seconds: '12'
    }
  }
];

describe('Stats tests', () => {
  let comp = null;
  beforeEach(() => {
    comp = mount(<Statistics />);
  });

  test('Stats contains a go to menu button', () => {
    expect(comp.find('.tomenu').exists()).toEqual(true);
  });

  test('Stats displays total number of games only when mounted', () => {
    expect(comp.find('.totalgames').exists()).toEqual(false);
    comp.setProps({ user: { total_games: 10 } });
    comp.setState({ isMounted: true });
    expect(comp.find('.totalgames').exists()).toEqual(true);
  });

  test('Stats displays the correct number of maps', () => {
    comp.instance().allMaps = content;
    comp.setProps({ user: { total_games: 10, map_0: 11, map_1: 20 } });
    comp.setState({ isMounted: true });
    expect(
      comp.find('.besttime').filterWhere(n => n.name() === 'h3').length
    ).toEqual(2);
  });
});
