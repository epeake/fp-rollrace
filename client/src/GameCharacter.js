import React, { Component } from 'react';

// Jump state enum for clarity
const jump = {
  STOP: 0,
  UP: 1,
  DOWN: 2
};
const JUMP_HEIGHT = 120;
const JUMP_TIME = 500;
const UPDATE_TIMEOUT = 0.01;

class GameCharacter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jumpStartTime: undefined,
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
        jumpStartTime: new Date().getTime()
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
    // don't begin a jump if no jump was initialized
    if (this.state.jumpState !== jump.STOP) {
      // mid jump
      const currentTime = new Date().getTime();
      if (currentTime - this.state.jumpStartTime < JUMP_TIME) {
        setTimeout(() => {
          this.setState({
            y:
              this.state.yStart -
              Math.abs(
                Math.abs(
                  ((currentTime - this.state.jumpStartTime) / JUMP_TIME) *
                    2 *
                    JUMP_HEIGHT -
                    JUMP_HEIGHT
                ) - JUMP_HEIGHT
              )
          });
        }, UPDATE_TIMEOUT);
      }

      // stop jump when jump should be over and return the sprite to the original prejump location
      else {
        this.setState({ jumpState: jump.STOP, y: this.state.yStart });
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
