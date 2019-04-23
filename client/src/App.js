import React, { Component } from 'react';
import GameEngine from './GameEngine.js';
import styled from 'styled-components';
import realbutton from './buttonSVGs/realPlaybutton.svg';
import settingsbutton from './buttonSVGs/settingsbutton.svg';
import statsbutton from './buttonSVGs/statsbutton.svg';
import { ReactComponent as title } from './buttonSVGs/title.svg';
import './App.css';
import Settings from './settings.js';
import Statistics from './Statistics.js';

const StyledTitle = styled(title)`
  height: 100;
`;

const StyledButton = styled.img`
  display: block;
  margin: auto;
`;

/* eslint-disable react/prefer-stateless-function */
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: [
        'm 0, 450 h 1159 v -180 h 1159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
      ],
      strokeWidth: 6, // must be an even number for the parsing algorithm
      mode: 'menu'
    };
    this.handleGoToMenu = this.handleGoToMenu.bind(this);
  }

  handleGoToMenu() {
    this.setState({ mode: 'menu' });
  }
  render() {
    const { mode } = this.state;
    if (mode === 'game') {
      return (
        <GameEngine
          mapProps={Object.assign(
            {},
            { map: this.state.map, strokeWidth: this.state.strokeWidth }
          )}
          GoToMenu={this.handleGoToMenu}
        />
      );
    }
    if (mode === 'menu') {
      // <div className="settings-button">
      return (
        <div>
          <StyledTitle />
          <div className="play-button">
            <StyledButton
              src={realbutton}
              height="50"
              alt="play"
              onClick={() => this.setState({ mode: 'game' })}
            />
            <StyledButton
              src={settingsbutton}
              height="50"
              alt="settings"
              onClick={() => this.setState({ mode: 'settings' })}
            />
            <StyledButton
              src={statsbutton}
              height="50"
              alt="stats"
              onClick={() => this.setState({ mode: 'stats' })}
            />
          </div>
        </div>
      );
    }

    if (mode === 'settings') {
      return (
        <div>
          <Settings goToMenu={this.handleGoToMenu} />
        </div>
      );
    }
    if (mode === 'stats') {
      return (
        <div>
          <Statistics goToMenu={this.handleGoToMenu} />
        </div>
      );
    }
  }
}

export default App;
