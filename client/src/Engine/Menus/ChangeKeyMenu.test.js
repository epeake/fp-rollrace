import React from 'react';
import ChangeKeyMenu from './ChangeKeyMenu.js';
import { shallow, mount } from 'enzyme';

describe('Change key menu tests', () => {
  const goBack = jest.fn();
  const showModal = true;
  const currentKey = 32;
  let comp;

  // Snapshot for reference
  describe('Change Key menu snapshot test', () => {
    test('progressBar snapshot', () => {
      comp = shallow(
        <ChangeKeyMenu
          goBack={goBack}
          showModal={showModal}
          currentKey={currentKey}
        />
      );
      expect(comp).toMatchSnapshot();
    });
  });

  describe('Change Key menu test functionality', () => {
    beforeEach(() => {
      comp = mount(
        <ChangeKeyMenu
          goBack={goBack}
          showModal={showModal}
          currentKey={currentKey}
        />
      );
    });

    // test props are same as what we assigned
    test('Prop testing', () => {
      expect(comp.props().showModal).toEqual(true);
      expect(comp.props().currentKey).toEqual(32);
    });

    // tests that all the elements are rendered on the component
    test('Model Components are in place', () => {
      expect(comp.find('.modalprovider').exists()).toEqual(true);
      expect(comp.find('.styledmodal').exists()).toEqual(true);
      expect(comp.find('.instruction').exists()).toEqual(true);
      expect(comp.find('.current').exists()).toEqual(true);
      expect(comp.find('.selected').exists()).toEqual(false);
    });

    // Test the back button on the component
    test('Component renders the back button', () => {
      expect(comp.find('.back').exists()).toEqual(true);
    });

    test('Clicking back button calls  correct callback function', () => {
      const backButton = comp
        .find('.back')
        .filterWhere(n => n.name() === 'button');
      backButton.simulate('click');
      expect(goBack).toHaveBeenCalledTimes(1);
    });
  });
});
