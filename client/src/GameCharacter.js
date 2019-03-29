import React, { Component } from 'react';

// Jump state enum for clarity
const jump = {
  STOP: 0,
  UP: 1,
  DOWN: 2
};
const JUMP_HEIGHT = 120;
const JUMP_INCREMENT = 3;
const UPDATE_TIMEOUT = 1;

class GameCharacter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 400,
      y: 400,
      yStart: 400,
      jumpState: jump.STOP
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  // Allows the character to jump when spacebar is pressed
  handleKeyPress(event) {
    if (event.keyCode === 87 && this.state.jumpState === jump.STOP) {
      // so they can't jump mid jump
      this.setState({
        yStart: this.state.y,
        jumpState: jump.UP,
        y: this.state.y - 3
      });
    }
  } // Handle animation

  componentDidUpdate() {
    // don't bother checking conditionals if still stopped
    if (this.state.jumpState !== jump.STOP) {
      if (
        this.state.yStart - this.state.y < JUMP_HEIGHT &&
        this.state.jumpState === jump.UP
      ) {
        setTimeout(() => {
          this.setState({ y: this.state.y - JUMP_INCREMENT });
        }, UPDATE_TIMEOUT);
      } else if (
        this.state.yStart - this.state.y >= JUMP_HEIGHT &&
        this.state.jumpState === jump.UP
      ) {
        this.setState({
          jumpState: jump.DOWN,
          y: this.state.y + JUMP_INCREMENT
        });
      } else if (
        this.state.yStart - this.state.y > 0 &&
        this.state.jumpState === jump.DOWN
      ) {
        setTimeout(() => {
          this.setState({ y: this.state.y + JUMP_INCREMENT });
        }, UPDATE_TIMEOUT);
      } else if (
        this.state.yStart - this.state.y === 0 &&
        this.state.jumpState === jump.DOWN
      ) {
        this.setState({ jumpState: jump.STOP });
      }
    }
  }

  render() {
    const docBody = document.querySelector('body');
    docBody.addEventListener('keypress', e => this.handleKeyPress(e));

    return (
      <svg viewBox={`0 0 1000 1000`} preserveAspectRatio={'xMidYMid meet'}>
                
        <circle
          cx={this.state.x}
          cy={this.state.y}
          r={40}
          stroke={'black'}
          strokeWidth={1}
          fill={'green'}
        />
              
      </svg>
    );
  }
}

export default GameCharacter;
