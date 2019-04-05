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
      x: 400,
      y: 400,
      yStart: 400,
      jumpState: jump.STOP,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

    this.jumpStartTime = null;

    /*
     * I don't know why, but the event gets messed up after rerendering if
     * timeout is not in the constructor...
     */
    this.timeout = null;

    this.debounce = this.debounce.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  /*
   * Prevent functions from event handlers from being repeatedly called.
   * This is essential for on window resize, which could potentially be called
   * a ton.
   *
   * Params: func: function to debounce
   *         delay: how long to wait after the last call until we fire func
   *         ...args: func's arguements
   */
  debounce(func, delay, ...args) {
    return () => {
      let fireLater = () => {
        func(...args);
      };

      clearTimeout(this.timeout);
      this.timeout = setTimeout(fireLater, delay);
    };
  }

  // Allows the character to jump when spacebar is pressed
  handleKeyPress(event) {
    // TODO: promise so excecutes when hits bottom?
    if (event.keyCode === 32 && this.state.jumpState === jump.STOP) {
      // so they can't jump mid jump
      this.jumpStartTime = new Date().getTime();
      this.setState({
        yStart: this.state.y,
        jumpState: jump.UP
      });
    } else {
      void 0; // do nothing
    }
  }

  // Resets our current window dimentions
  handleWindowResize() {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
  }

  // Handle animation
  componentDidUpdate() {
    // don't begin a jump if no jump was initialized
    if (this.state.jumpState !== jump.STOP) {
      // mid jump
      const currentTime = new Date().getTime();
      if (currentTime - this.jumpStartTime < JUMP_TIME) {
        setTimeout(() => {
          this.setState({
            y:
              this.state.yStart -
              Math.abs(
                Math.abs(
                  ((currentTime - this.jumpStartTime) / JUMP_TIME) *
                    2 *
                    JUMP_HEIGHT -
                    JUMP_HEIGHT
                ) - JUMP_HEIGHT
              )
          });
        }, UPDATE_TIMEOUT); // timeout controls animation speed
      } else {

      /*
       * stop jump when jump should be over and return the sprite to the
       * original prejump location
       */
        this.setState({ jumpState: jump.STOP, y: this.state.yStart });
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
