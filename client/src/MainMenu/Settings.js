import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row } from 'reactstrap';
import styled from 'styled-components';
import {
  MenuBackground,
  MenuTitle,
  MenuButton,
  MenuText
} from '../Style/MenuStyle.js';

const SettingsOption = styled.div`
  padding-top: 5%;
  padding-bottom: 5%;
  background-color: #323232;
  margin-left: 2%;
  margin-right: 2%;
`;

const ColorLabel = styled.div`
  display: inline-block;
  width: 30%;
  text-align: left;
  color: white;
`;

const LabeledSlider = props => {
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
};

LabeledSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  valueChange: PropTypes.func.isRequired
};

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      red: Math.random() * 255,
      green: Math.random() * 255,
      blue: Math.random() * 255
    };
    this.handleClick = this.handleClick.bind(this);
    this.selectColor = this.selectColor.bind(this);
    this.makeColor = this.makeColor.bind(this);
  }
  handleClick() {
    this.props.goToMenu();
  }

  selectColor() {
    const color = `rgb(${this.state.red},${this.state.green},${
      this.state.blue
    })`;
    this.props.selectedColor(color);
  }

  makeColor() {
    const color = `rgb(${this.state.red},${this.state.green},${
      this.state.blue
    })`;
    return color;
  }

  render() {
    return (
      <MenuBackground>
        <MenuTitle> Settings </MenuTitle>
        <MenuButton onClick={this.handleClick}>{'<-'} Main Menu</MenuButton>
        <Row>
          <SettingsOption>
            <MenuText> Choose Your Color </MenuText>
            <svg height="100" width="100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="white"
                strokeWidth="1"
                fill={this.makeColor()}
              />
            </svg>
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
          </SettingsOption>
          <SettingsOption>
            <MenuText> Choose Your Nickname </MenuText>
          </SettingsOption>
        </Row>
        <MenuButton onClick={this.selectColor}> Save Settings </MenuButton>
      </MenuBackground>
    );
  }
}

Settings.propTypes = {
  goToMenu: PropTypes.func.isRequired
};

export default Settings;