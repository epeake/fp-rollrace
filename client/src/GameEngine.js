import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import ChangeKeyMenu from './ChangeKeyMenu.js';
import ProgressBar from './ProgressBar.js';
import { findMapSpan, buildMapHashtable } from './mapParser.js';
import Timer from './Timer.js';
import Tutorial from './Tutorial.js';
import styled from 'styled-components';
// for client socket
import io from 'socket.io-client';
import request from 'request';

const postBody = {
  username: 'epeake223',
  password: '12345'
};

request.post(
  {
    url: 'http://localhost:3000/api/users',
    body: postBody,
    json: true
  },
  function(error, response, body) {
    console.log(body);
  }
);

const SVGLayer = styled.svg`
  position: absolute;
`;

// Jump state enum for clarity
const jump = {
  STOP: 0,
  UP: 1,
  DOWN: 2
};

const TOOLBAR_Y = 15;
const UPDATE_TIMEOUT = 0.5; // time between location updates and state change checks
const RENDER_TIMEOUT = 20; // time between rerenders
const JUMP_SPEED = 0.0009; // acceleration
const JUMP_POWER = 0.6; // jumping velocity
const SCROLL_SPEED = 0.25;
const SPRITE_SIDE = 100;
const WALL_THRESH = 3;
const FLOOR_THRESH = 15;

const INITIAL_STATE = {
  tutorial: false,
  paused: false,
  blocked: false,
  jumpKey: 32,
  changingKey: false,
  x: 53, // maybe not necessary
  y: 340,
  jumpStartTime: null,
  descendStartTime: null,
  gameStartTime: null,
  mapTranslationStartTime: null,
  mapTranslation: 0,
  mapTranslationStart: 0,
  pauseOffsetStart: 0,
  timePaused: 0,
  yStart: 400, // seems very arbitrary
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

    // temporary variables to hold location values inbetween rerenders
    this.mapTranslation = this.state.mapTranslation;
    this.y = this.state.y;

    /*
     * each game will have a socket to connect back to the server
     * store the other players as a member for THIS player
     */
    this.socket = io.connect();
    this.timeout = null;
    this.renderInterval = null;
    this.updateInterval = null;

    this.mapLength = findMapSpan(this.props.mapProps.map);
    this.map = buildMapHashtable(
      this.mapLength,
      this.props.mapProps.strokeWidth,
      this.props.mapProps.map
    );

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
    let { gameStartTime, mapTranslationStartTime } = this.state;
    const currentTime = new Date().getTime();
    if (!this.state.gameStartTime) {
      gameStartTime = currentTime;
      mapTranslationStartTime = currentTime;
    }

    this.setState({
      gameStartTime: gameStartTime,
      mapTranslationStartTime: mapTranslationStartTime,
      jumpStartTime: currentTime,
      yStart: this.y,
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
    this.renderInterval = null;
    this.updateInterval = null;

    // resetting temporary variables
    this.mapTranslation = INITIAL_STATE.mapTranslation;
    this.y = INITIAL_STATE.y;

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
    const timeElapsed = new Date().getTime() - this.state.pauseOffsetStart;
    this.setState({
      paused: false,
      timePaused: this.state.timePaused + timeElapsed,
      mapTranslationStartTime: this.state.mapTranslationStartTime + timeElapsed,
      jumpStartTime: this.state.jumpStartTime + timeElapsed,
      descendStartTime: this.state.descendStartTime + timeElapsed
    });
  }

  /*
  resumeGame(){
    this.mapTranslation = INITIAL_STATE.mapTranslation;
    this.y = INITIAL_STATE.y;


    this.timeout = null;
    this.renderInterval = null;
    this.updateInterval = null;

    const restartState = Object.assign({}, INITIAL_STATE, {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });

    this.setState(restartState);

    this.props.GoToMenu();
  }
*/

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

  componentWillUnmount() {
    // prevent memory leak by deleting interval function
    clearInterval(this.renderInterval);
    clearInterval(this.updateInterval);
  }

  componentDidMount() {
    // this splits up different types of activities so the game doesn't rerender
    // every time it checks for wall etc.
    this.renderInterval = setInterval(() => {
      this.setState({
        mapTranslation: this.mapTranslation,
        y: this.y
      });
    }, RENDER_TIMEOUT);

    this.updateInterval = setInterval(() => {
      this.updateGamestate();
    }, UPDATE_TIMEOUT);

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

  // checks for nescesary state changes
  updateGamestate() {
    if (this.state.gameStartTime && !this.state.paused) {
      const currentTime = new Date().getTime();
      const { jumpStartTime } = this.state;
      let {
        blocked,
        jumpState,
        yStart,
        descendStartTime,
        mapTranslationStart,
        mapTranslationStartTime
      } = this.state;

      let y = this.y;
      let mapTranslation = this.mapTranslation;

      let onPath = false;
      let atWall = false;

      const currX = Math.round(this.state.x - mapTranslation);

      // Scan to detect paths and walls for front edge of sprite
      (() => {
        for (let i = 0; i < WALL_THRESH; i++) {
          const locations = this.map[currX + i + SPRITE_SIDE];
          for (let j = 0; j < locations.length; j++) {
            if (onPath && atWall) {
              return;
            }
            if (atWall === false && locations[j][0] === 'b') {
              if (
                (locations[j][1] <= y && y <= locations[j][2]) ||
                (locations[j][1] <= y + SPRITE_SIDE &&
                  y + SPRITE_SIDE <= locations[j][2])
              ) {
                atWall = true;
              }
            } else if (
              onPath === false &&
              locations[j][1] - FLOOR_THRESH <= y + SPRITE_SIDE &&
              y + SPRITE_SIDE <= locations[j][1]
            ) {
              onPath = true;
            }
          }
        }
      })();
      // either becomes blocked or unblocked
      if (atWall !== blocked) {
        if (blocked) {
          blocked = false;
          mapTranslationStartTime = currentTime;
        } else {
          blocked = true;
          mapTranslationStart = mapTranslation;
        }
      }
      // only run if we are not currently going up
      if (jumpState !== jump.UP) {
        // Scan to detect paths for trailing edge of sprite
        (() => {
          for (let i = 0; i < WALL_THRESH; i++) {
            const locations = this.map[currX + i];
            for (let j = 0; j < locations.length; j++) {
              if (
                locations[j][0] === 'h' &&
                (locations[j][1] - FLOOR_THRESH <= y + SPRITE_SIDE &&
                  y + SPRITE_SIDE <= locations[j][1])
              ) {
                onPath = true;
                return;
              }
            }
          }
        })();

        // either begin fall or stop fall
        if (onPath !== (jumpState === jump.STOP)) {
          if (onPath) {
            jumpState = jump.STOP;
          } else {
            yStart = y;
            jumpState = jump.DOWN;
            descendStartTime = currentTime;
          }
        }
      }

      // falling action
      if (jumpState === jump.DOWN) {
        y = yStart + 0.5 * (currentTime - descendStartTime) ** 2 * JUMP_SPEED;
      }
      // jumping action
      else if (jumpState === jump.UP) {
        if (JUMP_POWER - JUMP_SPEED * (currentTime - jumpStartTime) >= 0) {
          y =
            yStart -
            ((currentTime - jumpStartTime) * JUMP_POWER -
              0.5 * (currentTime - jumpStartTime) ** 2 * JUMP_SPEED);
        } else {
          yStart = y;
          jumpState = jump.DOWN;
          descendStartTime = currentTime;
        }
      }

      // don't update background if blocked
      if (!blocked) {
        this.mapTranslation =
          mapTranslationStart -
          (currentTime - mapTranslationStartTime) * SCROLL_SPEED;
      }

      // update y location
      this.y = y;

      // update state if something important changed
      if (
        blocked !== this.state.blocked ||
        jumpState !== this.state.jumpState ||
        mapTranslationStart !== this.state.mapTranslationStart ||
        mapTranslationStartTime !== this.state.mapTranslationStartTime ||
        yStart !== this.state.yStart ||
        descendStartTime !== this.state.descendStartTime ||
        jumpStartTime !== this.state.jumpStartTime
      ) {
        this.setState({
          mapTranslation: mapTranslation,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          y: y,
          jumpState: jumpState,
          yStart: yStart,
          blocked: blocked,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime
        });
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
        height={SPRITE_SIDE}
        width={SPRITE_SIDE}
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
              height={SPRITE_SIDE}
              width={SPRITE_SIDE}
              fill={player.color}
            />
          );
        })
      );
    }

    if (!this.state.tutorial) {
      return (
        <>
          <div>
            <Timer />
          </div>
          <SVGLayer
            viewBox={'0 0 2000 5000'}
            preserveAspectRatio={'xMaxYMin slice'}
            height={this.state.windowHeight}
            width={this.state.windowWidth}
          >
            <ProgressBar y={TOOLBAR_Y} />
            <Map
              translation={this.state.mapTranslation}
              map={this.props.mapProps.map}
              stroke={this.props.mapProps.strokeWidth}
            />
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

              <g onClick={() => this.setState({ tutorial: true })}>
                {' '}
                {/* pauses game because within pausing div*/}
                <rect
                  key={'help-me'}
                  rx={15}
                  ry={15}
                  x={115}
                  y={15}
                  height={50}
                  width={50}
                  fill={'pink'}
                />
                <text x={135} y={45} height={50} width={50}>
                  ?
                </text>
              </g>
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
    } else {
      return <Tutorial handlePlay={() => this.setState({ tutorial: false })} />;
    }
  }
}

export default GameEngine;
