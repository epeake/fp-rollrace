import React, { Component } from 'react';
import Map from './Map.js';

// Jump state enum for clarity
const jump = {
  STOP: 0,
  UP: 1,
  DOWN: 2
};
const JUMP_HEIGHT = 120;
const JUMP_TIME = 500;
const UPDATE_TIMEOUT = 0.01;
const SCROLL_SPEED = 1 / 5;

class GameEngine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 60,
      y: 360,
      mapTranslation: 0,
      yStart: 400,
      jumpState: jump.STOP,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

    this.gameStartTime = null;
    this.jumpStartTime = null;

    /*
     * I don't know why, but the event gets messed up after rerendering if
     * timeout is not in the constructor...
     */
    this.timeout = null;
    this.mapTimeout = null;

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
      const fireLater = () => {
        func(...args);
      };

      clearTimeout(this.timeout);
      this.timeout = setTimeout(fireLater, delay);
    };
  }

  /*
   * Allows the character to jump when spacebar is pressed and prevents the
   * character from jumping mid-jump
   */
  handleKeyPress(event) {
    if (event.keyCode === 32 && this.state.jumpState === jump.STOP) {
      if (!this.gameStartTime) {
        this.gameStartTime = new Date().getTime();
      }
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
        /*
         * Need to clear timeout or the calls start to stack up and too many
         * fire one after another, changing the scroll speed and causing
         * extra computation.
         */
        clearTimeout(this.mapTimeout);
        this.mapTimeout = setTimeout(() => {
          this.setState({
            mapTranslation:
              (this.gameStartTime - new Date().getTime()) * SCROLL_SPEED,
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
        }, UPDATE_TIMEOUT); // prevent max depth calls
      } else {
        /*
         * stop jump when jump should be over and return the sprite to the
         * original prejump location
         */
        this.setState({ jumpState: jump.STOP, y: this.state.yStart });
      }
    } else {
      clearTimeout(this.mapTimeout);
      this.mapTimeout = setTimeout(() => {
        this.setState({
          mapTranslation:
            (this.gameStartTime - new Date().getTime()) * SCROLL_SPEED
        });
      }, UPDATE_TIMEOUT);
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
        height={this.state.windowHeight}
        width={this.state.windowWidth}
      >
                
        <Map translation={this.state.mapTranslation} />
        <rect
          rx={15}
          ry={15}
          x={this.state.x}
          y={this.state.y}
          height={80}
          width={80}
          fill={'orange'}
        />
        <g>
          <rect
            rx={15}
            ry={15}
            x={15}
            y={15}
            height={50}
            width={50}
            fill={'red'}
          />
          <rect x={28} y={28} height={25} width={10} fill={'black'} />
          <rect x={43} y={28} height={25} width={10} fill={'black'} />
        </g>
              
      </svg>
    );
  }
}

export default GameEngine;
