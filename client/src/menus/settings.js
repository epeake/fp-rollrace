import React, { Component } from 'react';
import PropTypes from 'prop-types';
import settings from '../buttonSVGs/settings.svg';
import return2menu from '../buttonSVGs/return2menu.svg';
import styled from 'styled-components';

const ColorBox = styled.div`
  width: 50px;
  height: 50px;
  border: 1px solid black;
  margin: auto;
  background: ${props => `rgb(${props.red},${props.green},${props.blue})`};
`;

const ColorLabel = styled.div`
  display: inline-block;
  width: 50px;
  text-align: left;
  margin: auto;
`;

function LabeledSlider(props) {
  return (
    <div>
      <ColorLabel>{props.label}:</ColorLabel>
      <input
        type="range"
        min="0"
        max="255"
        step="1"
        value={props.value}
        onChange={event => props.valueChange(parseInt(event.target.value, 10))}
      />
    </div>
  );
}

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = { red: 0, green: 0, blue: 0 };
    this.handleClick = this.handleClick.bind(this);
    this.selectColor = this.selectColor.bind(this);
  }
  handleClick() {
    this.props.goToMenu();
  }

  selectColor() {
    let color = `rgb(${this.state.red},${this.state.green},${this.state.blue})`;
    this.props.selectedColor(color);
  }

  render() {
    return (
      <div>
        <img src={settings} className="settingslogo" alt="settings" />
        <div>
          <ColorBox
            red={this.state.red}
            green={this.state.green}
            blue={this.state.blue}
          />
          <LabeledSlider
            label="Red"
            value={this.state.red}
            valueChange={value => {
              this.setState({ red: value });
            }}
          />
          <LabeledSlider
            label="Green"
            value={this.state.green}
            valueChange={value => {
              this.setState({ green: value });
            }}
          />
          <LabeledSlider
            label="Blue"
            value={this.state.blue}
            valueChange={value => {
              this.setState({ blue: value });
            }}
          />
          <button onClick={this.selectColor}> Select Color </button>
        </div>
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
LabeledSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  valueChange: PropTypes.func.isRequired
};

Settings.propTypes = {
  goToMenu: PropTypes.func.isRequired
};
export { ColorBox };
export default Settings;
