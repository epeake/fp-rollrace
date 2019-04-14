import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import ChangeKeyMenu from './ChangeKeyMenu.js';
import { findMapSpan, buildMapHashtable } from './mapParser.js';
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
//const JUMP_HEIGHT = 150;
const UPDATE_TIMEOUT = 0.0001;
const JUMP_SPEED = 0.0009;
const JUMP_POWER = 0.6;
const SCROLL_SPEED = 0.2;
const SPRITE_SIDE = 80;
const FLOOR_THRESH = 10;
const INITIAL_STATE = {
  paused: false,
  blocked: false,
  jumpKey: 32,
  changingKey: false,
  x: 60, // maybe not necessary
  y: 360,
  jumpStartTime: null,
  descendStartTime: null,
  gameStartTime: null,
  mapTranslationStartTime: null,
  mapTranslation: 0,
  mapTranslationStart: 0,
  pauseOffsetStart: 0,
  timePaused: 0,
  totalGameTime: 0,
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
    const timeElapsed = new Date().getTime() - this.state.pauseOffsetStart;
    this.setState({
      paused: false,
      timePaused: this.state.timePaused + timeElapsed,
      mapTranslationStartTime: this.state.mapTranslationStartTime + timeElapsed,
      jumpStartTime: this.state.jumpStartTime + timeElapsed,
      descendStartTime: this.state.descendStartTime + timeElapsed
    });
    // } else if (this.state.blocked) {
    //   this.setState({
    //     blocked: false,
    //     translationOffset: this.state.translationOffset +
    //       new Date().getTime() -
    //       this.state.pauseOffsetStart,
    //     jumpStartTime:
    //       this.state.jumpStartTime +
    //       new Date().getTime() -
    //       this.state.pauseOffsetStart
    //   });
    // }
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
      const currentTime = new Date().getTime();
      let {
        blocked,
        jumpState,
        y,
        yStart,
        gameStartTime,
        timePaused,
        descendStartTime,
        mapTranslation,
        mapTranslationStart,
        mapTranslationStartTime,
        jumpStartTime
      } = this.state;

      let onPath = false;
      let atWall = false;

      const currX = Math.round(this.state.x - mapTranslation);

      // we check in a 3 window range
      // let currMap = [
      //   ...this.map[currX + SPRITE_SIDE],
      //   ...this.map[currX + 1 + SPRITE_SIDE],
      //   ...this.map[currX + 2 + SPRITE_SIDE],
      // ];
      for (let i = 0; i < Math.ceil(FLOOR_THRESH / 2); i++) {
        this.map[currX + i + SPRITE_SIDE].forEach(location => {
          //console.log(location);
          if (location[0] === 'b') {
            if (
              (location[1] <= y && y <= location[2]) ||
              (location[1] <= y + SPRITE_SIDE && y + SPRITE_SIDE <= location[2])
            ) {
              //console.log('blocked')
              atWall = true;
            }
          } else if (
            location[1] - FLOOR_THRESH <= y + SPRITE_SIDE &&
            y + SPRITE_SIDE <= location[1]
          ) {
            //console.log(y);
            //console.log(362-1 <= 200 + 80 <= 362);
            //console.log(location);
            onPath = true;
          }
        });
      }
      //console.log(currMap)
      if (atWall !== blocked) {
        //console.log('blocked')
        //console.log(atWall !== blocked);
        if (blocked) {
          blocked = false;
          mapTranslationStartTime = currentTime;
          //pause
        } else {
          //console.log('blocked')
          blocked = true;
          mapTranslationStart = mapTranslation;
          //unpause
        }
      }
      if (jumpState !== jump.UP) {
        // for (let i = 0; i <= 2; i++){
        //   currMap[i] = this.map[currX + i]
        // }
        for (let i = 0; i < Math.ceil(FLOOR_THRESH / 2); i++) {
          this.map[currX + i].forEach(location => {
            if (
              location[0] === 'h' &&
              (location[1] - FLOOR_THRESH <= y + SPRITE_SIDE &&
                y + SPRITE_SIDE <= location[1])
            ) {
              //console.log(y);
              //console.log(362-1 <= 200 + 80 <= 362);
              //console.log(location);
              onPath = true;
            }
          });
        }

        if (onPath !== (jumpState === jump.STOP)) {
          if (onPath) {
            //console.log('on path')
            jumpState = jump.STOP;
          } else {
            yStart = y;
            jumpState = jump.DOWN;
            descendStartTime = currentTime;
          }
        }
      }
      if (jumpState === jump.DOWN) {
        //console.log('fell');
        y = yStart + 0.5 * (currentTime - descendStartTime) ** 2 * JUMP_SPEED;
      } else if (jumpState === jump.UP) {
        // mid jump case
        //console.log(JUMP_POWER - JUMP_SPEED*(currentTime - jumpStartTime));
        if (JUMP_POWER - JUMP_SPEED * (currentTime - jumpStartTime) >= 0) {
          y =
            yStart -
            ((currentTime - jumpStartTime) * JUMP_POWER -
              0.5 * (currentTime - jumpStartTime) ** 2 * JUMP_SPEED);
        } else {
          //console.log('descending');
          yStart = y;
          jumpState = jump.DOWN;
          descendStartTime = currentTime;
        }
      }
      if (!blocked) {
        mapTranslation =
          mapTranslationStart -
          (currentTime - mapTranslationStartTime) * SCROLL_SPEED;
      }
      clearTimeout(this.mapTimeout);
      this.mapTimeout = setTimeout(() => {
        this.setState({
          totalGameTime: gameStartTime - currentTime - timePaused,
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

    // now we need to account for other players that should be rendered
    let boxes = undefined;
    if (this.state.players) {
      // TODO: need unique key for players
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
          <Map
            translation={this.state.mapTranslation}
            map={this.props.mapProps.map}
            stroke={this.props.mapProps.strokeWidth}
          />
          {boxes}
          <rect
            rx={15}
            ry={15}
            x={this.state.x}
            y={this.state.y}
            height={SPRITE_SIDE}
            width={SPRITE_SIDE}
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
