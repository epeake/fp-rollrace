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
      jumpState: jump.STOP,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

    this.temporaryState = {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

    this.debounce = this.debounce.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  // Prevent functions from event handlers from being repeatedly called
  debounce(func, delay, ...args) {
    let timeout;

    return () => {
      let fireLater = () => {
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(fireLater, delay);
    };
  }

  // Allows the character to jump when spacebar is pressed
  handleKeyPress(event) {
    // TODO: promise so excecutes when hits bottom?
    if (event.keyCode === 32 && this.state.jumpState === jump.STOP) {
      // so they can't jump mid jump
      this.setState({
        yStart: this.state.y,
        jumpState: jump.UP,
        y: this.state.y - 3
      });
    } else {
      void 0; // do nothing
    }
  }

  // Resets our current window dimentions
  handleWindowResize() {
    Object.assign(this.temporaryState, {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  }

  // Handle animation
  componentDidUpdate() {
    // don't bother checking conditionals if still stopped
    if (this.state.jumpState !== jump.STOP) {
      // going up
      if (
        this.state.yStart - this.state.y < JUMP_HEIGHT &&
        this.state.jumpState === jump.UP
      ) {
        setTimeout(() => {
          this.setState({ y: this.state.y - JUMP_INCREMENT });
        }, UPDATE_TIMEOUT);
      }

      // we've hit the top
      else if (
        this.state.yStart - this.state.y >= JUMP_HEIGHT &&
        this.state.jumpState === jump.UP
      ) {
        this.setState({
          jumpState: jump.DOWN,
          y: this.state.y + JUMP_INCREMENT
        });
      }

      // coming down
      else if (
        this.state.yStart - this.state.y > 0 &&
        this.state.jumpState === jump.DOWN
      ) {
        setTimeout(() => {
          this.setState({ y: this.state.y + JUMP_INCREMENT });
        }, UPDATE_TIMEOUT);
      }

      // we've hit the bottom
      else if (
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

    window.addEventListener(
      'resize',
      this.debounce(this.handleWindowResize, 500)
    );

    return (
      <svg
        viewBox={'0 0 500 1000'}
        preserveAspectRatio={'xMinYMin meet'}
        height={window.innerHeight}
        width={window.innerWidth}
      >
                
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
