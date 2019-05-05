import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row } from 'reactstrap';
import styled from 'styled-components';

const ColorLabel = styled.div`
  display: inline-block;
  width: 30%;
  text-align: left;
  color: white;
`;

const StyledButton = styled.button`
  background-color: #fffff;
  font-size: 16px;
  border-radius: 12px;
  border: 2px solid #555555;
  font-family: monospace;
  &:hover {
    background-color: #e8e8e8;
  }
`;

const Background = styled.div`
  background-color: #323232;
  height: 100vh;
`;

const SettingsOption = styled.div`
  padding-top: 5%;
  padding-bottom: 5%;
  background-color: #323232;
  margin-left: 2%;
  margin-right: 2%;
`;

// CSS for title changes whther or not user is on chrome.  Condition checks for chrome
const Title = styled.h1`
  font-family: 'Gugi', cursive;
  font-size: 600%;
  color: white;
`;

const OptionText = styled.h3`
  font-family: 'Gugi', cursive;
  font-size: 200%;
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
      <Background>
        <Title> Settings </Title>
        <StyledButton onClick={this.handleClick}>
          {' '}
          {'<-'} Main Menu{' '}
        </StyledButton>
        <Row>
          <SettingsOption>
            <OptionText> Choose Your Color </OptionText>
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
            <OptionText> Choose Your Nickname </OptionText>
          </SettingsOption>
        </Row>
        <StyledButton onClick={this.selectColor}> Save Settings </StyledButton>
      </Background>
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

export default Settings;
