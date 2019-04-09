import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import styled from 'styled-components';

const SVGLayer = styled.svg`
  position: absolute;
`;

// Jump state enum for clarity
const jump = {
  STOP: 0,
  UP: 1,
  DOWN: 2
};
const JUMP_HEIGHT = 150;
const JUMP_TIME = 500;
const UPDATE_TIMEOUT = 0.01;
const SCROLL_SPEED = 1 / 5;

class GameEngine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      x: 60,
      y: 360,
      jumpStartTime: null,
      gameStartTime: null,
      mapTranslation: 0,
      pauseOffsetStart: 0,
      pauseOffset: 0,
      yStart: 400,
      jumpState: jump.STOP,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };

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
      if (!this.state.gameStartTime) {
        this.setState({
          gameStartTime: new Date().getTime()
        });
      }

      this.setState({
        jumpStartTime: new Date().getTime(),
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
    // don't update if game has not started
    if (this.state.gameStartTime && !this.state.paused) {
      // don't begin a jump if no jump was initialized
      if (this.state.jumpState !== jump.STOP) {
        const currentTime = new Date().getTime();

        // mid jump case
        if (currentTime - this.state.jumpStartTime < JUMP_TIME) {
          /*
           * Need to clear timeout or the calls start to stack up and too many
           * fire one after another, changing the scroll speed and causing
           * extra computation.
           */
          clearTimeout(this.mapTimeout);
          this.mapTimeout = setTimeout(() => {
            this.setState({
              mapTranslation:
                (this.state.gameStartTime -
                  currentTime +
                  this.state.pauseOffset) *
                SCROLL_SPEED,
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
          }, UPDATE_TIMEOUT); // prevent max depth calls
        } else {
          /*
           * stop jump when jump should be over and return the sprite to the
           * original prejump location
           */
          this.setState({
            jumpState: jump.STOP,
            y: this.state.yStart,
            mapTranslation:
              (this.state.gameStartTime -
                currentTime +
                this.state.pauseOffset) *
              SCROLL_SPEED
          });
        }
      } else {
        clearTimeout(this.mapTimeout);
        this.mapTimeout = setTimeout(() => {
          this.setState({
            mapTranslation:
              (this.state.gameStartTime -
                new Date().getTime() +
                this.state.pauseOffset) *
              SCROLL_SPEED
          });
        }, UPDATE_TIMEOUT);
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
      <>
        <SVGLayer
          viewBox={'0 0 1000 2000'}
          preserveAspectRatio={'xMaxYMin slice'}
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
          <g
            onClick={() => {
              if (this.state.gameStartTime) {
                console.log('paused');
                this.setState({
                  paused: true,
                  pauseOffsetStart: new Date().getTime()
                });
              }
            }}
          >
            <rect
              rx={15}
              ry={15}
              x={15}
              y={15}
              height={50}
              width={50}
              fill={'pink'}
            />
            <rect
              rx={5}
              ry={5}
              x={28}
              y={28}
              height={25}
              width={10}
              fill={'black'}
            />
            <rect
              rx={5}
              ry={5}
              x={43}
              y={28}
              height={25}
              width={10}
              fill={'black'}
            />
          </g>
        </SVGLayer>
        {this.state.paused ? (
          <SVGLayer
            viewBox={'0 0 2000 1000'}
            preserveAspectRatio={'xMinYMin meet'}
          >
            <PauseMenu
              windowHeight={this.state.windowHeight}
              windowWidth={this.state.windowWidth}
              resume={() => {
                this.setState({
                  paused: false,
                  pauseOffset:
                    this.state.pauseOffset +
                    new Date().getTime() -
                    this.state.pauseOffsetStart,
                  jumpStartTime:
                    this.state.jumpStartTime +
                    new Date().getTime() -
                    this.state.pauseOffsetStart
                });
              }}
            />
          </SVGLayer>
        ) : (
          <></>
        )}
      </>
    );
  }
}

export default GameEngine;
