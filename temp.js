import React, { Component } from 'react';
import Map from './Map.js';
import PauseMenu from './PauseMenu.js';
import ChangeKeyMenu from './ChangeKeyMenu.js';
import {findMapSpan, buildMapHashtable} from './mapParser.js';
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
const SPRITE_SIDE = 80;
const FLOOR_THRESH = 2;
const INITIAL_STATE = {
  paused: false,
  jumpKey: 32,
  changingKey: false,
  x: 60,  // maybe not necessary
  y: 360,
  jumpStartTime: null,
  descendStartTime: null,
  gameStartTime: null,
  mapTranslation: 0,
  pauseOffsetStart: 0,
  gameOffset: 0,
  translationOffset: 0,
  yStart: 400,
  jumpState: jump.STOP,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  players: undefined,
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
    this.map = buildMapHashtable(this.mapLength, this.props.mapProps.strokeWidth, this.props.mapProps.map);

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
      gameOffset:
        this.state.gameOffset +
        new Date().getTime() -
        this.state.pauseOffsetStart,
      translationOffset: this.state.translationOffset +
        new Date().getTime() -
        this.state.pauseOffsetStart,
      jumpStartTime:
        this.state.jumpStartTime +
        new Date().getTime() -
        this.state.pauseOffsetStart
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
      let {blocked, jumpState, yStart, descendStartTime, mapTranslation, jumpStartTime} = this.state;





      const currX = Math.round(this.state.x - (this.state.gameStartTime - currentTime + this.state.gameOffset) * SCROLL_SPEED);

      // we check in a 3 window range
      let currMap = [...this.map[currX + SPRITE_SIDE], ...this.map[currX + 1 + SPRITE_SIDE], ...this.map[currX + 2 + SPRITE_SIDE]];


      currMap.forEach((location) =>{
        if (location[0] == 'b' &&
        (location[1] <= this.state.y <= location[2] ||
          location[1] <= this.state.y + SPRITE_SIDE <= location[2])){
          blocked = true;
          pauseOffsetStart = currentTime;
        }
      })

      // append back end of character
      currMap = [...currMap, ...this.map[currX], ...this.map[currX + 1], ...this.map[currX + 2]];
      currMap.forEach((location) =>{
        if (location[0] == 'h' &&
        (location[1] - FLOOR_THRESH <= this.state.y <= location[1] ||
          location[1] - FLOOR_THRESH <= this.state.y + SPRITE_SIDE <= location[1])){
          jumpState = jump.STOP;
        }else{
          if (jumpState == jump.STOP){
            yStart = y;
            jumpState = jump.DOWN;
            descendStartTime = new Date().getTime();
          }
        }
      })

      if (jumpState === jump.DOWN) {


        y = yStart + (currentTime - descendStartTime) * JUMP_SPEED;
      } else if (jumpState === jump.UP) {
        // mid jump case
        if ((currentTime - jumpStartTime) * JUMP_SPEED <= JUMP_HEIGHT) {


          y =
            this.state.yStart - (currentTime - jumpStartTime) * JUMP_SPEED;
        } else {

          yStart = y;
          jumpState = jump.DOWN;
          descendStartTime = new Date().getTime();
        }
      }
      if (!blocked){
      mapTranslation = (this.state.gameStartTime -
        currentTime +
        this.state.translationOffset) *
      SCROLL_SPEED;
    }
      clearTimeout(this.mapTimeout);
        this.mapTimeout = setTimeout(() => {
          this.setState({
            mapTranslation: mapTranslation,
            y: y,
            jumpState: jumpState,
            yStart: yStart,
            mapTranslationStart: mapTranslationStart,
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
                  
          <Map translation={this.state.mapTranslation} />
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












// /*
// * Finds the boundaries of all our map paths so that we can allocate enough
// * space for our map hash table.
// *
// * @params: allPaths: Array<string> our SVG path strings
// *
// * @outputs: Array<int> [xMin, xMax, yMin, yMax] Out map boundaries
// */
// const findMapSpan = allPaths => {
//   let xMax = yMax = -Infinity;
//   let xMin = yMin = Infinity;
//   let xCurr, yCurr, ySplit;
//   let i;
//
//   // find x and y span
//   allPaths.forEach(path => {
//     const splitPath = path.split(/[hv]/);
//     const startPosition = splitPath[0].split(" ");  // assumes no comma
//     xCurr = parseInt(startPosition[1]);  // initiallize and initial checks
//     xMin = Math.min(xCurr, xMin)
//     // yCurr = parseInt(startPosition[2]);
//     // yMax = Math.max(yMax, yCurr);
//     // yMin = Math.min(yMin, yCurr);
//     for (i = 1; i < splitPath.length; i++) {
//       if (i % 2 === 1) {  // assumes first h then v
//         xCurr += eval(splitPath[i].trim().replace(/ /g, "+"));  // replace all
//       }
//       // else {
//       //   ySplit = splitPath[i].trim().split(" ");
//       //   ySplit.forEach(y => {
//       //     yCurr += parseInt(y)
//       //     yMax = Math.max(yMax, yCurr);
//       //     yMin = Math.min(yMin, yCurr);
//       //   });
//       // }
//     }
//     xMax = Math.max(xMax, xCurr);
//   })
//
//   return [xMin, xMax]
// };
//
// findMapSpan(['m 2340 100 h 511 v -111 h 159 v 175 h 206 v -127 h 127 v -111 h 143 v 238 h 127 v -95 h 111 v 95 h 111 v -95 h 143 v 95 h 159 v -190 h 127 v 159 h 175 v -111 h 159 v 111 h 143 v -95 h 127 v 95 h 476'])
// findMapSpan(['m 2340 100'])  // expect [2340, 2340, 100, 100]
// findMapSpan(['m 0 0'])  // expect [0, 0, 0, 0]
// findMapSpan(['m 100 0 h 511 v -111 h 159 v 175 h 206 v -127'])  // expect [100, 976, -111, 64]
// findMapSpan(['m 100 0 h 511'])  // expect [100, 611, 0, 0]
// findMapSpan(['m 100 0 h 511 2 3 0 v -111 -3 h 159 v 3 175 -1 7 h 206 v -127'])  // expect [100, 983, -114, 70]
//
//
// const buildMapHashtable = (allPaths, bounds) => {
//   const { xMin, xMax } = bounds;
//   const xRange = xMax - xMin;
//   const hashedPaths = Array(xRange).fill([]);  // array of arrays
//   let xCurr, yCurr, xNext, yNext, ySplit, xSplit;
//   let i;
//
//   // populate map
//   allPaths.forEach(path => {
//     const splitPath = path.split(/[hv]/);
//     const startPosition = splitPath[0].split(" ");  // assumes no comma
//     xCurr = parseInt(startPosition[1]);  // initiallize and initial checks
//     yCurr = parseInt(startPosition[2]);
//     for (i = 1; i < splitPath.length; i++) {
//       if (i % 2 === 1) {  // assumes first h then v
//         xNext = xCurr + eval(splitPath[i].trim().replace(/ /g, "+"));
//         for (i = xCurr; i <= xNext; i++) {
//           currMap[i].push(['h', yCurr])  // mark that it is ground, and the y position
//         }
//       } else {
//         yStart = yCurr;
//         yCurr += eval(splitPath[i].trim().replace(/ /g, "+"))
//         ySplit.forEach(y => {
//           currMap.push(['v', yStart, yCurr])  // mark that it is wall, and the y positions
//         });
//       }
//     }
//     hashedPaths.push()
//   })
// };
