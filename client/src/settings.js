import React, { Component } from 'react';
//import PropTypes from 'prop-types';
import settings from './buttonSVGs/settings.svg';
import return2menu from './buttonSVGs/return2menu.svg';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.props.GoToMenu();
  }
  render() {
    return (
      <div>
        <img src={settings} className="settingslogo" alt="settings" />
        <div>
          <img
            src={return2menu}
            height="50"
            className="2menubutton"
            alt="2menu"
            onClick={this.handleClick}
          />
        </div>
      </div>
    );
  }
}
/*
Settings.propTypes = {
  GoToMenu: PropTypes.func.isRequired
};
*/

export default Settings;
