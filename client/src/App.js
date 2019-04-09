import React, { Component } from 'react';
import GameCharacter from './GameCharacter.js';
import ProgressBar from './ProgressBar.js';

/* eslint-disable react/prefer-stateless-function */

class App extends Component {
  render() {
    return (
      <div>
        <ProgressBar />
        <GameCharacter />
      </div>
    );
  }
}

export default App;
