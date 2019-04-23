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
const UPDATE_TIMEOUT = 3; // time between location updates and state change checks
const BUFFER_TIMEOUT = 3; // time between motionChange updates
const RENDER_TIMEOUT = 30; // time between rerenders
const JUMP_SPEED = 0.0008; // acceleration
const JUMP_POWER = 0.6; // jumping velocity
const SCROLL_SPEED = 0.2;
const SPRITE_SIDE = 100;
//const WALL_THRESH = 5;
//const FLOOR_THRESH = 5;

const INITIAL_STATE = {
  tutorial: false,
  paused: false,
  gameover: false,
  jumpKey: 32,
  changingKey: false,
  y: 350,
  mapTranslation: 0,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  players: undefined,
  color: `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() *
    255})`
};

const INITIAL_VARIABLES = {
  yStart: INITIAL_STATE.y, // seems very arbitrary

  x: 200, // maybe not necessary
  minY: 1000, // should loop over all of map or whatever to find this.

  motionChange: undefined, // will take {time: 'value', event: block} options for event are block, go, land, and fall

  pauseOffsetStart: undefined,
  timePaused: 0,
  gameStartTime: undefined,
  mapTranslationStartTime: undefined,
  jumpState: jump.STOP,
  jumpStartTime: undefined,
  descendStartTime: undefined,
  mapTranslationStart: 0,

  atWall: false
};

// time between updates sent to the server
const UPDATE_INTERVAL = 40; // milliseconds

class GameEngine extends Component {
  constructor(props) {
    super(props);
    this.state = INITIAL_STATE;
    this.variables = Object.assign({}, INITIAL_VARIABLES);

    // temporary variables to hold location values inbetween rerenders

    /*
     * each game will have a socket to connect back to the server
     * store the other players as a member for THIS player
     */
    this.socket = io.connect();
    this.timeout = null;
    this.renderInterval = null;
    this.updateInterval = null;
    this.bufferInterval = null;

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
    this.variables.jumpState = jump.UP;
    this.variables.jumpStartTime = new Date().getTime();
    this.variables.motionChange = undefined;
    //console.log('jump!');
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
      this.variables.jumpState === jump.STOP &&
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
    //console.log('restarting');

    //this.timeout = null;
    // this.renderInterval = null;
    // this.updateInterval = null;
    // this.bufferInterval = null;
    //clearTimeout(this.timeout);
    clearInterval(this.updateInterval);
    clearInterval(this.renderInterval);
    clearInterval(this.bufferInterval);

    // resetting temporary variables

    Object.assign(this.variables, INITIAL_VARIABLES);
    /*
     * make sure window is correct size
     * (person may have changes window while playing so can't really make a default for it)
     */
    const restartState = Object.assign({}, INITIAL_STATE, {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
    this.setState(restartState);
    //console.log(INITIAL_VARIABLES);
    this.startLoops();
  }

  // Resumes our after being paused
  resumeGame() {
    const timeElapsed = new Date().getTime() - this.variables.pauseOffsetStart;
    this.variables.timePaused = this.variables.timePaused + timeElapsed;
    this.variables.mapTranslationStartTime =
      this.variables.mapTranslationStartTime + timeElapsed;
    this.variables.jumpStartTime = this.variables.jumpStartTime + timeElapsed;
    this.variables.descendStartTime =
      this.variables.descendStartTime + timeElapsed;
    if (this.variables.motionChange) {
      this.variables.motionChange.time =
        this.variables.motionChange.time + timeElapsed;
    }
    this.setState({
      paused: false
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
    if (this.variables.gameStartTime) {
      this.variables.pauseOffsetStart = new Date().getTime();
      this.setState({
        paused: true
      });
    } else {
      void 0; // don't pause if we haven't started
    }
  }

  endGame() {
    this.pauseGame();
    this.setState({
      gameover: true
    });
  }

  AfindWall(props) {
    //console.log(maxTranslation);
    const {
      mapTranslation,
      mapTranslationStart,
      mapTranslationStartTime,
      maxX,
      descendStartTime,
      jumpStartTime,
      jumpState,
      yStart,
      y,
      atWall
    } = props;
    let currentX = Math.round(
      this.variables.x + SPRITE_SIDE / 2 - mapTranslation
    );
    //console.log(currentX);
    for (currentX; currentX <= maxX; currentX++) {
      //console.log(locations);
      const locations = this.map[currentX];
      for (let j = 0; j < locations.length; j++) {
        const newY = this.AgetY({
          currentTime: this.AgetTimeForGivenX({
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            atWall: atWall,
            x: currentX - SPRITE_SIDE
          }),
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y
        });
        if (locations[j][0] === 'b' && this.checkAtWall(locations[j], newY)) {
          //console.log(currentX);
          //console.log(locations[j]);
          //console.log(currentX);
          //console.log(this.getTimeForGivenX(currentX));
          return {
            time: this.AgetTimeForGivenX({
              mapTranslationStart: mapTranslationStart,
              mapTranslationStartTime: mapTranslationStartTime,
              atWall: atWall,
              x: currentX - SPRITE_SIDE
            }),
            event: 'block'
          };

          //console.log(this.mapTranslationStartTime);
          // using our algorithm for calculating the mapTranslation we can calcualte when we shall reach a certain map location
        }
      }
    }
    return undefined;

    //console.log(this.motionChange);
  }

  /*
    const mapTranslation = this.AgetMapTranslation({
        currentTime: currentTime,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        mapTranslation: mapTranslation,
        atWall: atWall,
      });
  */

  AfindPath(props) {
    const {
      currentTime,
      mapTranslationStart,
      mapTranslationStartTime,
      mapTranslation,
      atWall,
      yStart,
      descendStartTime,
      jumpState,
      jumpStartTime,
      maxX
    } = props;
    let currentX = Math.round(this.variables.x - mapTranslation);
    //console.log('maxX', maxX);
    let highest = this.variables.minY; // max y value
    for (currentX; currentX <= maxX; currentX++) {
      // const adjustedMapTranslation = this.x - (currentX - SPRITE_SIDE);
      // const time = (this.mapTranslationStart - adjustedMapTranslation)/ SCROLL_SPEED + this.mapTranslationStartTime
      // const y = this.getY(time)
      const locations = this.map[currentX];
      for (let j = 0; j < locations.length; j++) {
        //const time = Math.sqrt((-this.yStart + locations[j][1] - SPRITE_SIDE) / (0.5 * JUMP_SPEED)) + this.descendStartTime;
        //const testX = this.x - this.getMapTranslation(time);
        //console.log(currentX);
        //console.log(locations[j][1]-SPRITE_SIDE);
        //console.log(time);

        if (
          locations[j][0] === 'h' &&
          locations[j][1] - SPRITE_SIDE < highest
        ) {
          const time = this.AgetTimeForGivenY({
            yStart: yStart,
            y: locations[j][1] - SPRITE_SIDE,
            descendStartTime: descendStartTime,
            jumpState: jumpState,
            jumpStartTime: jumpStartTime,
            currentTime: currentTime
          });
          const xBack = this.AgetX({
            currentTime: time,
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            mapTranslation: mapTranslation,
            atWall: atWall
          });
          const xFront = xBack + SPRITE_SIDE;
          if (xBack <= currentX && currentX <= xFront) {
            //console.log('FOUND!');
            highest = locations[j][1] - SPRITE_SIDE;
          }
        }
      }
    }
    if (highest !== this.variables.minY) {
      return {
        time: this.AgetTimeForGivenY({
          yStart: yStart,
          y: highest,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          currentTime: currentTime
        }),
        event: 'land',
        y: highest
      };
    } else {
      return undefined;
    }
  }

  AfindEndOfPath(props) {
    const {
      mapTranslation,
      y,
      mapTranslationStart,
      mapTranslationStartTime,
      atWall
    } = props;

    //console.log(props);
    //console.log('y', y +SPRITE_SIDE);
    //console.log(this.mapTranslationStartTime);
    //console.log(new Date().getTime());
    //console.log(mapTranslation);
    let currentX = Math.round(this.variables.x - mapTranslation + SPRITE_SIDE);
    //console.log(currentX);
    //const y = this.map[currentX][0][1];
    //console.log(currentX);
    for (currentX; currentX <= this.mapLength; currentX++) {
      const locations = this.map[currentX];
      //console.log(locations);
      let found = false;
      for (let j = 0; j < locations.length; j++) {
        //if (locations[j][0] ==='h'){
        //console.log(locations[j]);
        //}
        if (
          locations[j][0] === 'h' &&
          Math.abs(locations[j][1] - (y + SPRITE_SIDE)) < 9
        ) {
          //console.log('hi');
          //console.log(locations[j]);
          found = true;

          //eta = (this.mapTranslationStart - (this.x - currentX)) / SCROLL_SPEED + this.mapTranslationStartTime
          //console.log(eta);
        }
      }
      if (!found) {
        //console.log('atleast');
        return {
          time: this.AgetTimeForGivenX({
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            atWall: atWall,
            x: currentX - this.props.mapProps.strokeWidth * 2
          }),
          event: 'fall'
        };
      }
    }
    //console.log('good?');
    return undefined;
  }

  checkAtWall(location, y) {
    //console.log(currentX, y);
    if (
      location[0] === 'b' &&
      ((location[1] <= y && y <= location[2]) ||
        (location[1] <= y + SPRITE_SIDE && y + SPRITE_SIDE <= location[2]))
    ) {
      return true;
    }
    return false;
  }

  AgetTimeForGivenY(props) {
    if (props.jumpState === jump.DOWN) {
      //console.log('descend');
      //console.log(this.yStart);
      //console.log(this.descendStartTime);
      //console.log(this.yStart + 0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED);
      return (
        Math.sqrt((-props.yStart + props.y) / (0.5 * JUMP_SPEED)) +
        props.descendStartTime
      );
      // y = this.yStart + 0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED
      // -(0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED) = this.yStart - y
      // (currentTime - this.descendStartTime) ** 2 = (-this.yStart + y)/(0.5 * JUMP_SPEED)
      // currentTime - this.descendStartTime = sqrt((-this.yStart + y)/(0.5 * JUMP_SPEED))
      // currentTime = sqrt((-this.yStart + y)/(0.5 * JUMP_SPEED)) + this.descendStartTime
    } else if (props.jumpState === jump.UP) {
      //two return statments depending on whether it will reach at all
      //console.log('jumping up');
      //return this.yStart - ((currentTime - this.jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - this.jumpStartTime) ** 2 * JUMP_SPEED);
      //if (JUMP_POWER - JUMP_SPEED * (currentTime - this.jumpStartTime) >= 0) {
      //return this.yStart - ((currentTime - this.jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - this.jumpStartTime) ** 2 * JUMP_SPEED);
      return (
        (-Math.sqrt(
          JUMP_POWER ** 2 +
            2 * props.y * JUMP_SPEED -
            2 * JUMP_SPEED * props.yStart
        ) +
          JUMP_POWER +
          props.jumpStartTime * JUMP_SPEED) /
        JUMP_SPEED
      );
      //}
    } else {
      return props.currentTime;
    }
  }

  AgetTimeForGivenX(props) {
    //console.log(props);
    if (props.atWall === true) {
      console.log('return undefined');
      return undefined;
    } else {
      return (
        (props.mapTranslationStart - (this.variables.x - props.x)) /
          SCROLL_SPEED +
        props.mapTranslationStartTime
      );
      // mapTranslation = this.mapTranlationStart - currentTime * SCROLL_SPEED + this.mapTranslationStartTime * SCROLL_SPEED
      // currentTime * SCROLL_SPEED = this.mapTranslationStart - mapTranslation + this.mapTranslationStartTime * SCROLL_SPEED
      // currentTime = (this.mapTranslationStart - mapTranslation + this.mapTranslationStartTime * SCROLL_SPEED) / SCROLL_SPEED
      // currentTime = (this.mapTranslationStart - mapTranslation)/ SCROLL_SPEED + this.mapTranslationStartTime
      // currentX = this.state.x - mapTranslation
      // mapTranslation = this.state.x - currentX
    }
  }

  AgetX(
    props = {
      currentTime: new Date().getTime(),
      mapTranslationStart: this.variables.mapTranslationStart,
      mapTranslationStartTime: this.variables.mapTranslationStartTime,
      mapTranslation: this.state.mapTranslation,
      atWall: this.variables.atWall
    }
  ) {
    return (
      this.variables.x -
      this.AgetMapTranslation({
        currentTime: props.currentTime,
        mapTranslationStart: props.mapTranslationStart,
        mapTranslationStartTime: props.mapTranslationStartTime,
        mapTranslation: props.mapTranslation,
        atWall: props.atWall
      })
    );
  }

  AgetMapTranslation(
    props = {
      currentTime: new Date().getTime(),
      mapTranslationStart: this.variables.mapTranslationStart,
      mapTranslationStartTime: this.variables.mapTranslationStartTime,
      mapTranslation: this.state.mapTranslation,
      atWall: this.variables.atWall
    }
  ) {
    // uses mapTranslationStart, action, mapTranslationStartTime = undefined
    //console.log(this.atWall);
    //const it = [3, 34, 6];
    //console.log(it[7].item);
    //console.log(this.variables.atWall);
    //console.log(props);
    if (props.atWall === true || this.state.paused === true) {
      return this.state.mapTranslation;
    } else {
      return (
        props.mapTranslationStart -
        (props.currentTime - props.mapTranslationStartTime) * SCROLL_SPEED
      );
      // mapTranslation = this.mapTranlationStart - currentTime * SCROLL_SPEED + this.mapTranslationStartTime * SCROLL_SPEED
      // currentTime * SCROLL_SPEED = this.mapTranslationStart - mapTranslation + this.mapTranslationStartTime * SCROLL_SPEED
      // currentTime = (this.mapTranslationStart - mapTranslation + this.mapTranslationStartTime * SCROLL_SPEED) / SCROLL_SPEED
      // currentTime = (this.mapTranslationStart - mapTranslation)/ SCROLL_SPEED + this.mapTranslationStartTime
      // currentX = this.state.x - mapTranslation
      // mapTranslation = this.state.x - currentX
    }
  }

  AgetY(
    props = {
      currentTime: new Date().getTime(),
      descendStartTime: this.variables.descendStartTime,
      jumpStartTime: this.variables.jumpStartTime,
      jumpState: this.variables.jumpState,
      yStart: this.variables.yStart,
      y: this.state.y
    }
  ) {
    if (props.jumpState === jump.STOP || this.state.paused === true) {
      return props.y;
    }
    // uses yStart, action, yStartTime = undefined
    else if (props.jumpState === jump.DOWN) {
      //console.log('descend');
      //console.log(this.yStart);
      //console.log(this.descendStartTime);
      //console.log(this.yStart + 0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED);
      //if (!(this.yStart + 0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED)){
      //console.log('panic if');
      //console.log(this.yStart);
      //}
      return (
        props.yStart +
        0.5 * (props.currentTime - props.descendStartTime) ** 2 * JUMP_SPEED
      );
      // y = this.yStart + 0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED
      // -(0.5 * (currentTime - this.descendStartTime) ** 2 * JUMP_SPEED) = this.yStart - y
      // (currentTime - this.descendStartTime) ** 2 = (-this.yStart + y)/(0.5 * JUMP_SPEED)
      // currentTime - this.descendStartTime = sqrt((-this.yStart + y)/(0.5 * JUMP_SPEED))
      // currentTime = sqrt((-this.yStart + y)/(0.5 * JUMP_SPEED)) + this.descendStartTime
    } else if (props.jumpState === jump.UP) {
      //if (!(this.yStart - ((currentTime - this.jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - this.jumpStartTime) ** 2 * JUMP_SPEED))){
      //console.log('panic else if');
      //}
      //console.log('jumping up');
      //return this.yStart - ((currentTime - this.jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - this.jumpStartTime) ** 2 * JUMP_SPEED);
      //if (JUMP_POWER - JUMP_SPEED * (currentTime - this.jumpStartTime) >= 0) {
      return (
        props.yStart -
        ((props.currentTime - props.jumpStartTime) * JUMP_POWER -
          0.5 * (props.currentTime - props.jumpStartTime) ** 2 * JUMP_SPEED)
      );
      //}
    }
  }

  findNextChange() {
    // declare local variables
    let currentTime = new Date().getTime();
    let y = this.AgetY();
    let mapTranslation = this.AgetMapTranslation();
    //console.log(mapTranslation);
    let {
      yStart,
      x,
      minY,
      descendStartTime,
      jumpState,
      jumpStartTime,
      atWall,
      mapTranslationStart,
      mapTranslationStartTime
    } = this.variables;

    //if (false){
    if (this.variables.motionChange) {
      // set local variables to buffer (this code is copied from componentDidMount)
      currentTime = this.variables.motionChange.time;
      y = this.AgetY({
        currentTime: currentTime,
        descendStartTime: descendStartTime,
        jumpStartTime: jumpStartTime,
        jumpState: jumpState,
        yStart: yStart,
        y: y
      });
      mapTranslation = this.AgetMapTranslation({
        currentTime: currentTime,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        mapTranslation: mapTranslation,
        atWall: atWall
      });
      if (this.variables.motionChange.event === 'block') {
        atWall = true;
        mapTranslationStart = this.AgetMapTranslation({
          currentTime: currentTime,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall
        });
      } else if (this.variables.motionChange.event === 'go') {
        mapTranslationStartTime = currentTime;
        atWall = false;
      } else if (this.variables.motionChange.event === 'land') {
        jumpState = jump.STOP;
        yStart = this.AgetY({
          currentTime: currentTime,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y
        });
      } else {
        // this.motionChange.event === 'fall'
        //console.log('just fall already');
        yStart = this.AgetY({
          currentTime: currentTime,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y
        });
        jumpState = jump.DOWN;
        descendStartTime = currentTime;
      }
    }

    //console.log('thing');
    if (jumpState !== jump.STOP || atWall === false) {
      // don't do anything if the character isn't moving
      //console.log(this.atWall);
      if (atWall === true) {
        // either we're going to fall until we are no longer blocked or we're going to jump until we're not blocked anymore
        if (jumpState === jump.UP) {
          // calculate when the bottom of the sprite will clear the wall (what happens if it doesn't stays undefined?)
          //console.log('get path wall');
          let currentX = Math.round(x - mapTranslationStart);
          let found = false;
          let wall;
          while (!found) {
            const locations = this.map[currentX];
            for (let j = 0; j < locations.length; j++) {
              if (locations[j][0] === 'b') {
                // need to add a case where there are two wall with the same x value
                //console.log('found');
                wall = locations[j];
                found = true;
              }
            }
            currentX++;
          }
          const peakTime = JUMP_POWER / JUMP_SPEED + jumpStartTime;
          //console.log('trying');
          if (
            this.AgetY({
              currentTime: peakTime,
              descendStartTime: descendStartTime,
              jumpStartTime: jumpStartTime,
              jumpState: jumpState,
              yStart: yStart,
              y: y
            }) >
            wall[1] - SPRITE_SIDE
          ) {
            //console.log('not ideal');
            return { time: peakTime, event: 'fall' };
          } else {
            //console.log('go/notideal');
            //console.log(this.jumpStartTime);
            //console.log(this.jumpStartTime);
            //console.log(eta);
            return {
              time: this.AgetTimeForGivenY({
                yStart: yStart,
                y: wall[1] - SPRITE_SIDE,
                descendStartTime: descendStartTime,
                jumpState: jumpState,
                jumpStartTime: jumpStartTime,
                currentTime: currentTime
              }),
              event: 'go'
            };
            //console.log(this.motionChange);
          }
          // y = yStart - ((currentTime - jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - jumpStartTime) ** 2 * JUMP_SPEED);
          // (currentTime - jumpStartTime) * JUMP_POWER - 0.5 * (currentTime - jumpStartTime) ** 2 * JUMP_SPEED = yStart - y
          //console.log(this.motionChange);
        } else {
          // (this.jumpState === jump.DOWN)
          // calculate when the top of the sprite will clear the wall or when we should land
          //console.log('looking for landing pad');
          let currentX = Math.round(x - mapTranslationStart);
          let found = false;
          let wall;
          while (!found) {
            const locations = this.map[currentX];
            for (let j = 0; j < locations.length; j++) {
              if (locations[j][0] === 'b') {
                // need to add a case where there are two wall with the same x value
                wall = locations[j];
                found = true;
              }
            }
            currentX++;
          }
          const timeToEscape = {
            time: this.AgetTimeForGivenY({
              yStart: yStart,
              y: wall[2],
              descendStartTime: descendStartTime,
              jumpState: jumpState,
              jumpStartTime: jumpStartTime,
              currentTime: currentTime
            }),
            event: 'go'
          };

          //console.log(new Date().getTime());
          const timeToLand = this.AfindPath({
            currentTime: currentTime,
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            mapTranslation: mapTranslation,
            atWall: atWall,
            yStart: yStart,
            descendStartTime: descendStartTime,
            jumpState: jumpState,
            jumpStartTime: jumpStartTime,
            maxX: currentX + SPRITE_SIDE
          });
          //console.log(new Date().getTime());
          if (!timeToLand || timeToLand.time > timeToEscape.time) {
            return timeToEscape;
          } else {
            return timeToLand;
          }
          //console.log(this.motionChange);
          //console.log(new Date().getTime());
        }
      }
      // we know (this.AtWall === false)
      else if (jumpState === jump.STOP) {
        // we're either going to fall off or hit a wall. Either way it is signified by a wall off some sort
        // iterate through the array until we find the end of the path
        // then if we should fall then calculate when the back of the sprite will clear the path
        // otherwise we're going to hit a wall so find when the front of the sprite will be at the wall
        //console.log('yes');
        //console.log(this.x - this.getMapTranslation());
        const endOfPath = this.AfindEndOfPath({
          mapTranslation: mapTranslation,
          y: y,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          atWall: atWall
        });

        //console.log(this.motionChange);
        //console.log(new Date().getTime());
        //console.log(this.getTimeForGivenX(endOfPath.time) + this.props.mapProps.strokeWidth * 2);
        const pathEnd = this.AgetX({
          currentTime: endOfPath.time,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall
        });
        //console.log(endOfPath);

        const wall = this.AfindWall({
          mapTranslation: mapTranslation,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          maxX: pathEnd + SPRITE_SIDE,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y,
          atWall: atWall
        });
        //console.log(this.motionChange);
        if (!wall || endOfPath.time < wall.time) {
          //console.log(wall);
          //console.log(endOfPath);
          return endOfPath;
        } else {
          return wall;
        }
        //console.log(wall, endOfPath);
      } else if (jumpState === jump.UP) {
        // we might get blocked
        // same as this.jumpState === jump.STOP ?
        const jumpEndTime = JUMP_POWER / JUMP_SPEED + jumpStartTime;

        const jumpEndX = this.AgetX({
          currentTime: jumpEndTime,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall
        });

        const wall = this.AfindWall({
          mapTranslation: mapTranslation,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          maxX: jumpEndX,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y,
          atWall: atWall
        });
        if (!wall || wall.time > jumpEndTime) {
          //console.log('going down');
          return { time: jumpEndTime, event: 'fall' };
        } else {
          return wall;
        }
        //JUMP_POWER - JUMP_SPEED * (currentTime - jumpStartTime) = 0
        // JUMP_POWER / JUMP_SPEED = currentTime - jumpStartTime
        // JUMP_POWER / JUMP_SPEED + jumpStartTime = currentTime
      } else {
        // (this.jumpState === jump.DOWN) we're falling so we might either get blocked or stop falling
        //console.log('eek');

        const maxX =
          this.AgetX({
            currentTime: this.AgetTimeForGivenY({
              yStart: yStart,
              y: minY,
              descendStartTime: descendStartTime,
              jumpState: jumpState,
              jumpStartTime: jumpStartTime,
              currentTime: currentTime
            }),
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            mapTranslation: mapTranslation,
            atWall: atWall
          }) + SPRITE_SIDE;

        const wall = this.AfindWall({
          mapTranslation: mapTranslation,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          maxX: maxX,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y,
          atWall: atWall
        });

        const path = this.AfindPath({
          currentTime: currentTime,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall,
          yStart: yStart,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          maxX: maxX
        });

        if (wall && path) {
          if (path.time <= wall.time) {
            return path;
          } else {
            return wall;
          }
        } else if (wall) {
          return wall;
        } else if (path) {
          return path;
        } else {
          console.log('panic');
        }
        //console.log(this.motionChange);
        // getting blocked is probably the same
        // IDK how to do this yet we check to see how long it is before we might hit a wall and then we check
        // all the x values ish until that one for the eirliest landing point and use that or the wall depending on which one would be
        // encountered first
      }
    }
    //console.log(this.motionChange);
  }

  startLoops() {
    //console.log('starting');
    const currentTime = new Date().getTime();
    this.variables.gameStartTime = currentTime;
    this.variables.mapTranslationStartTime = currentTime;

    this.bufferInterval = setInterval(() => {
      if (!this.variables.motionChange && this.state.paused === false) {
        this.variables.motionChange = this.findNextChange();
      }
    }, BUFFER_TIMEOUT);

    // this.bufferIntervalTemp = setInterval(() => {
    //   if (!this.variables.motionChangeTemp && this.variables.motionChange) {
    //     this.variables.motionChangeTemp = this.findNextChange();
    //   }
    // }, BUFFER_TIMEOUT);

    this.renderInterval = setInterval(() => {
      if (this.variables.motionChange && this.state.paused === false) {
        if (this.AgetX() >= this.mapLength - 666) {
          // 500 is a bad constant!
          this.endGame();
        } else {
          this.setState({
            mapTranslation: this.AgetMapTranslation(),
            y: this.AgetY()
          });
        }
      }
    }, RENDER_TIMEOUT);

    this.updateInterval = setInterval(() => {
      //console.log(this.motionChange);
      const currentTime = new Date().getTime();
      if (
        this.variables.motionChange &&
        this.variables.motionChange.time - currentTime < 0 &&
        this.state.paused === false
      ) {
        if (this.variables.motionChange.event === 'block') {
          //console.log('block');
          this.setState({
            mapTranslation: this.AgetMapTranslation({
              currentTime: this.variables.motionChange.time,
              mapTranslationStart: this.variables.mapTranslationStart,
              mapTranslationStartTime: this.variables.mapTranslationStartTime,
              mapTranslation: this.state.mapTranslation,
              atWall: this.variables.atWall
            })
          });
          this.variables.atWall = true;
          this.variables.mapTranslationStart = this.AgetMapTranslation();
        } else if (this.variables.motionChange.event === 'go') {
          //console.log('go');
          this.variables.mapTranslationStartTime = new Date().getTime();
          this.variables.atWall = false;
        } else if (this.variables.motionChange.event === 'land') {
          //console.log('land');
          //console.log(this.variables.motionChange.time - currentTime);
          this.setState({
            y:
              this.AgetY({
                currentTime: this.variables.motionChange.time,
                descendStartTime: this.variables.descendStartTime,
                jumpStartTime: this.variables.jumpStartTime,
                jumpState: this.variables.jumpState,
                yStart: this.variables.yStart,
                y: this.state.y
              }) -
              this.props.mapProps.strokeWidth / 2
          });
          this.variables.jumpState = jump.STOP;
          this.variables.yStart = this.AgetY();
        } else {
          // this.motionChange.event === 'fall'
          //console.log('just fall already');
          //console.log('fall');
          this.variables.yStart = this.AgetY();
          this.variables.jumpState = jump.DOWN;
          this.variables.descendStartTime = new Date().getTime();
        }
        this.variables.motionChange = undefined;
        //this.loadNextChange(); // this will take the precomputed next value and put it in the current thing and then compute another value this is essanetiall buffering or something and I think that doing it once will not take much space and will reap large rewards. Then the last hting to fix is well idk the rest is kind of a product of just the slowness and this might fix it all
      }
    }, UPDATE_TIMEOUT);
  }

  componentWillUnmount() {
    // prevent memory leak by deleting interval function
    clearInterval(this.renderInterval);
    clearInterval(this.updateInterval);
    clearInterval(this.bufferInterval);
  }

  componentDidMount() {
    // this splits up different types of activities so the game doesn't rerender
    // every time it checks for wall etc.

    this.startLoops();

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
  /*
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

      const currX = Math.round(this.x - mapTranslation);

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
            setTimeout(this.findLanding(), 0)

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
*/
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
        x={this.variables.x}
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
