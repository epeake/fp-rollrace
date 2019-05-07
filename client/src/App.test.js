import React from 'react';
import App from './App';
import { mount } from 'enzyme';
import Settings from './MainMenu/Settings.js';
import Statistics from './MainMenu/Statistics.js';
import MapChooser from './MainMenu/MapChooser.js';

describe('Main Menu rendering tests', () => {
  let app;
  beforeEach(async () => {
    app = mount(<App />);
    app.setState({ mode: 'menu' });
  });

  test('Starts in main menu with 4 button buttons', () => {
    expect(app.find('.settings').exists()).toEqual(true);
    expect(app.find('.stats').exists()).toEqual(true);
    expect(app.find('.single').exists()).toEqual(true);
    expect(app.find('.multi').exists()).toEqual(true);
  });

  test('Clicking on settings opens settings menu', () => {
    const settingsButton = app
      .find('.settings')
      .filterWhere(n => n.name() === 'button');
    settingsButton.simulate('click');
    expect(app).toContainExactlyOneMatchingElement(Settings);
  });

  test('Clicking on statistics opens statistics menu', () => {
    const statsButton = app
      .find('.stats')
      .filterWhere(n => n.name() === 'button');
    statsButton.simulate('click');
    expect(app).toContainExactlyOneMatchingElement(Statistics);
  });

  test('Clicking on play button opens mapchooser', () => {
    const playButton = app
      .find('.single')
      .filterWhere(n => n.name() === 'button');
    playButton.simulate('click');
    expect(app).toContainExactlyOneMatchingElement(MapChooser);
  });
});
