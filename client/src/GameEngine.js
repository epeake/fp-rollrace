import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import ChangeKeyMenu from './ChangeKeyMenu.js';
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
  jumpKey: 32,
  changingKey: false,
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
  players: undefined,
  color: `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() *
    255})`
};

// time between updates sent to the server
const UPDATE_INTERVAL = 40; // milliseconds

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
    this.handleJumpKey = this.handleJumpKey.bind(this);
    this.handleChangeJumpKey = this.handleChangeJumpKey.bind(this);
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

  // Initiates jump
  handleJumpKey() {
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
  }

  // Changes our current jump key
  handleChangeJumpKey(event) {
    this.setState({ jumpKey: event.keyCode, changingKey: false });
  }

  /*
   * Allows the character to jump when spacebar is pressed and prevents the
   * character from jumping mid-jump
   */
  handleKeyPress(event) {
    if (this.state.changingKey) {
      this.handleChangeJumpKey(event);
    } else if (
      event.keyCode === this.state.jumpKey &&
      this.state.jumpState === jump.STOP &&
      !this.state.paused
    ) {
      this.handleJumpKey();
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

    /*
     * make sure window is correct size
     * (person may have changes window while playing so can't really make a default for it)
     */
    const restartState = Object.assign({}, INITIAL_STATE, {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
    this.setState(restartState);
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
    this.socket.on('connect', () => {
      /*
        Pass the player and a call back that will give back
        the a list of players.

        Each player contains the (x, y) coordinates of THAT player
        the list will include THIS player

        The call back is used in order to make sure that the players
        are set after the emit call
      */

      /*
        this will occur when another player has joined
        the game (not when THIS player has joined)
      */
      this.socket.on('PLAYER', data => {
        this.setState({ players: data });
      });

      /* 
        Update the server with location of the 
        players map ever UPDATE_INTERVAL milliseconds.

        Also emit a CHANGE_POS event that allows
        server to update all other players on position of this player
       */

      setInterval(() => {
        const updatePlayer = {
          mapTrans: this.state.mapTranslation,
          y: this.state.y,
          color: this.state.color,
          key: this.socket.id
        };
        // use a callback
        this.socket.emit('CHANGE_POS', updatePlayer, data => {
          this.setState({ players: data });
        });
      }, UPDATE_INTERVAL);

      /*
        Using the mapTranslation allows THIS player to keep track of where OTHER 
        players are in the game. 
      */
      const player = {
        mapTrans: this.state.mapTranslation,
        y: this.state.y,
        color: this.state.color,
        key: this.socket.id
      };

      /*
        When a new player connects send the player
        to the server. The call back will have data about other players.
        
        To avoid having empty `rect' elements only set the state of 
        the players when there is data sent from the server
      */
      this.socket.emit('NEW_PLAYER', player, data => {
        if (data !== undefined && data.length > 0) {
          this.setState({ players: data });
        }
      });
    });
  }

  /*
   * TODO: CLEAN UP ONCE WE MERGE WITH KAI
   *
   * Handle animation
   */
  componentDidUpdate() {
    /*
     * Helpful for debugging
     */
    // componentDidUpdate(prevProps, prevState) {
    // Object.entries(this.props).forEach(([key, val]) =>
    //   prevProps[key] !== val && console.log(`Prop '${key}' changed`)
    // );
    // Object.entries(this.state).forEach(([key, val]) =>
    //   prevState[key] !== val && console.log(`State '${key}' changed`)
    // );

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
    const boxes = [
      <rect
        key={this.socket.id}
        rx={15}
        ry={15}
        x={this.state.x}
        y={this.state.y}
        height={80}
        width={80}
        fill={this.state.color}
      />
    ];

    if (this.state.players !== undefined) {
      // TODO: need unique key for players
      boxes.push(
        this.state.players.map(player => {
          return (
            <rect
              key={player.id}
              rx={15}
              ry={15}
              // this difference allows for other players
              // to be rendered at different places in the map
              // based on their x coordinate
              x={this.state.mapTranslation - player.mapTrans}
              y={player.y}
              height={80}
              width={80}
              fill={player.color}
            />
          );
        })
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
          <g onClick={() => this.pauseGame()}>
            <rect
              key={'pause-bkrnd'}
              rx={15}
              ry={15}
              x={15}
              y={15}
              height={50}
              width={50}
              fill={'black'}
            />
            <rect
              key={'lft-line'}
              rx={5}
              ry={5}
              x={28}
              y={28}
              height={25}
              width={10}
              fill={'white'}
            />
            <rect
              key={'rt-line'}
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
            {this.state.changingKey ? (
              <ChangeKeyMenu
                windowHeight={this.state.windowHeight}
                windowWidth={this.state.windowWidth}
                jumpKey={this.state.jumpKey}
              />
            ) : (
              <PauseMenu
                windowHeight={this.state.windowHeight}
                windowWidth={this.state.windowWidth}
                resume={() => this.resumeGame()}
                restart={() => this.restartGame()}
                changeKey={() => this.setState({ changingKey: true })}
              />
            )}
          </SVGLayer>
        ) : (
          <></>
        )}
      </>
    );
  }
}

export default GameEngine;
