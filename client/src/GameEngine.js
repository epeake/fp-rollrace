import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import styled from 'styled-components';
// for client socket
import io from 'socket.io-client';

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
const INITIAL_STATE = {
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
  windowHeight: window.innerHeight,
  players: undefined
};

class GameEngine extends Component {
  constructor(props) {
    super(props);
    this.state = INITIAL_STATE;

    /*
     * each game will have a socket to connect back to the server
     * store the other players as a member for THIS player
     */
    this.socket = io.connect('http://localhost:3001');
    this.timeout = null;
    this.mapTimeout = null;

    this.debounce = this.debounce.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.restartGame = this.restartGame.bind(this);
    this.resumeGame = this.resumeGame.bind(this);
    this.pauseGame = this.pauseGame.bind(this);
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

  // Restarts our game
  restartGame() {
    this.timeout = null;
    this.mapTimeout = null;
    this.setState(INITIAL_STATE);
  }

  // Resumes our after being paused
  resumeGame() {
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
  }

  // Pauses our game
  pauseGame() {
    if (this.state.gameStartTime) {
      this.setState({
        paused: true,
        pauseOffsetStart: new Date().getTime()
      });
    } else {
      void 0; // don't pause if we haven't started
    }
  }

  componentDidMount() {
    /*
      create a player with its coordinates
      to be sent to the server
    */
    const player = {
      x: this.state.x,
      y: this.state.y
    };

    this.socket.on('connect', () => {
      /*
        Pass the player and a call back that will give back
        the a list of players.

        Each player contains the (x, y) coordinates of THAT player
        the list will include THIS player

        The call back is used in order to make sure that the players
        are set after the emit call
      */
      this.socket.emit('NEW_PLAYER', player, data => {
        this.setState({ players: data });
        // update everyone else
      });

      /*
        this will occur when another player has joined
        the game (not when THIS player has joined)
      */
      this.socket.on('PLAYER', data => {
        this.setState({ players: data });
      });
    });
  }

  /*
   * TODO: CLEAN UP ONCE WE MERGE WITH KAI
   *
   * Handle animation
   */
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

    // now we need to account for other players that should be rendered
    let boxes = undefined;
    if (this.state.players) {
      boxes = this.state.players.map(player => {
        return (
          <rect
            rx={15}
            ry={15}
            x={player.x}
            y={player.y}
            height={80}
            width={80}
            fill={`rgb(${Math.random() * 255}, ${Math.random() *
              255}, ${Math.random() * 255})`}
          />
        );
      });
    } else {
      boxes = (
        <rect
          rx={15}
          ry={15}
          x={this.state.x}
          y={this.state.y}
          height={80}
          width={80}
          fill={`rgb(${Math.random() * 255}, ${Math.random() *
            255}, ${Math.random() * 255})`}
        />
      );
    }

    return (
      <>
        <SVGLayer
          viewBox={'0 0 1000 2000'}
          preserveAspectRatio={'xMaxYMin slice'}
          height={this.state.windowHeight}
          width={this.state.windowWidth}
        >
                  
          <Map translation={this.state.mapTranslation} />
          {boxes}
          <rect
            rx={15}
            ry={15}
            x={this.state.x}
            y={this.state.y}
            height={80}
            width={80}
            fill={'orange'}
          />
          <g onClick={() => this.pauseGame()}>
            <rect
              rx={15}
              ry={15}
              x={15}
              y={15}
              height={50}
              width={50}
              fill={'black'}
            />
            <rect
              rx={5}
              ry={5}
              x={28}
              y={28}
              height={25}
              width={10}
              fill={'white'}
            />
            <rect
              rx={5}
              ry={5}
              x={43}
              y={28}
              height={25}
              width={10}
              fill={'white'}
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
              resume={() => this.resumeGame()}
              restart={() => this.restartGame()}
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
