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

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  // Allows the character to jump when spacebar is pressed
  handleKeyPress(event) {
    // TODO: promise so excecutes when hits bottom (queue a single spacebar so maybe clear promisess)
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

  // https://alvarotrigo.com/blog/firing-resize-event-only-once-when-resizing-is-finished/
  handleWindowResize() {
    let resizeId;
    clearTimeout(resizeId);
    resizeId = setTimeout(() => {
      this.setState({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });
    }, 500); // wait until finished resizing until fired
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

    window.addEventListener('resize', () => this.handleWindowResize());

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
