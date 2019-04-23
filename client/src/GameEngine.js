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

// time between updates sent to the server
const UPDATE_INTERVAL = 40; // milliseconds

const TOOLBAR_Y = 15;
const UPDATE_TIMEOUT = 1; // time between motionChange updates
const RENDER_TIMEOUT = 30; // time between rerenders
const JUMP_SPEED = 0.0008; // acceleration
const JUMP_POWER = 0.6; // jumping velocity
const SCROLL_SPEED = 0.2;
const SPRITE_SIDE = 100;

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
  gameStartTime: undefined,

  x: 200,
  minY: 1000, // should loop over all of map or whatever to find this.

  // will take an object of the following form {time: , event: } options for event are block, go, land, and fall
  motionChange: undefined,

  yStart: INITIAL_STATE.y, // seems very arbitrary
  jumpState: jump.STOP,
  jumpStartTime: undefined,
  descendStartTime: undefined,

  mapTranslationStart: 0,
  atWall: false,
  mapTranslationStartTime: undefined,

  pauseOffsetStart: undefined,
  timePaused: 0
};

class GameEngine extends Component {
  constructor(props) {
    super(props);

    this.state = INITIAL_STATE;
    this.variables = Object.assign({}, INITIAL_VARIABLES);

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
    this.updateChangeMotion();
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
    // clear loops
    clearInterval(this.updateInterval);
    clearInterval(this.renderInterval);

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

    // start game
    this.startLoops();
  }

  // Resumes our game after being paused
  resumeGame() {
    const timeElapsed = new Date().getTime() - this.variables.pauseOffsetStart;

    // add the time elapsed to every relevant time
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

  // set gameover flag
  endGame() {
    this.pauseGame();
    this.setState({
      gameover: true
    });
  }

  // detects a future wall and returns the time of collision
  findWall(props) {
    // define local variables
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

    for (currentX; currentX <= maxX; currentX++) {
      const locations = this.map[currentX];
      for (let j = 0; j < locations.length; j++) {
        const newY = this.getY({
          currentTime: this.getTimeForGivenX({
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
          return {
            time: this.getTimeForGivenX({
              mapTranslationStart: mapTranslationStart,
              mapTranslationStartTime: mapTranslationStartTime,
              atWall: atWall,
              x: currentX - SPRITE_SIDE
            }),
            event: 'block'
          };
        }
      }
    }
    return undefined;
  }

  // detects a future path and returns the time of landing
  findPath(props) {
    // declare local variables
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
    let highest = this.variables.minY;

    for (currentX; currentX <= maxX; currentX++) {
      const locations = this.map[currentX];
      for (let j = 0; j < locations.length; j++) {
        if (
          locations[j][0] === 'h' &&
          locations[j][1] - SPRITE_SIDE < highest
        ) {
          const time = this.getTimeForGivenY({
            yStart: yStart,
            y: locations[j][1] - SPRITE_SIDE,
            descendStartTime: descendStartTime,
            jumpState: jumpState,
            jumpStartTime: jumpStartTime,
            currentTime: currentTime
          });
          const xBack = this.getX({
            currentTime: time,
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            mapTranslation: mapTranslation,
            atWall: atWall
          });
          const xFront = xBack + SPRITE_SIDE;
          if (xBack <= currentX && currentX <= xFront) {
            highest = locations[j][1] - SPRITE_SIDE;
          }
        }
      }
    }

    if (highest !== this.variables.minY) {
      // if path found
      return {
        time: this.getTimeForGivenY({
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
      // no path found
      return undefined;
    }
  }

  // detects the end of the current path and returns the time of arrival
  AfindEndOfPath(props) {
    // declare local variables
    const {
      mapTranslation,
      y,
      mapTranslationStart,
      mapTranslationStartTime,
      atWall
    } = props;

    let currentX = Math.round(this.variables.x - mapTranslation + SPRITE_SIDE);

    for (currentX; currentX <= this.mapLength; currentX++) {
      const locations = this.map[currentX];
      let found = false;
      for (let j = 0; j < locations.length; j++) {
        if (
          locations[j][0] === 'h' &&
          Math.abs(locations[j][1] - (y + SPRITE_SIDE)) < 9
        ) {
          found = true;
        }
      }
      if (!found) {
        return {
          time: this.getTimeForGivenX({
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            atWall: atWall,
            x: currentX - this.props.mapProps.strokeWidth * 2
          }),
          event: 'fall'
        };
      }
    }
    return undefined;
  }

  // checks to see if a given y value matches a wall
  checkAtWall(location, y) {
    if (
      location[0] === 'b' &&
      ((location[1] <= y && y <= location[2]) ||
        (location[1] <= y + SPRITE_SIDE && y + SPRITE_SIDE <= location[2]))
    ) {
      return true;
    }
    return false;
  }

  /*
  return the time when the sprite will reach the given y value also given the state of the game
    comes from solving the distance function in getY for time
  */
  getTimeForGivenY(props) {
    if (props.jumpState === jump.DOWN) {
      return (
        Math.sqrt((-props.yStart + props.y) / (0.5 * JUMP_SPEED)) +
        props.descendStartTime
      );
    } else if (props.jumpState === jump.UP) {
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
    } else {
      console.log('returning undefined');
      return undefined;
    }
  }

  /*
  return the time when the sprite will reach the given x value also given the state of the game
    comes from solving the distance function in getX for time
  */
  getTimeForGivenX(props) {
    if (props.atWall === true) {
      console.log('return undefined');
      return undefined;
    } else {
      return (
        (props.mapTranslationStart - (this.variables.x - props.x)) /
          SCROLL_SPEED +
        props.mapTranslationStartTime
      );
    }
  }

  // return the x value of the sprite given current state of the game
  getX(
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
      this.getMapTranslation({
        currentTime: props.currentTime,
        mapTranslationStart: props.mapTranslationStart,
        mapTranslationStartTime: props.mapTranslationStartTime,
        mapTranslation: props.mapTranslation,
        atWall: props.atWall
      })
    );
  }

  // return the mapTranslation value given current state of the game
  getMapTranslation(
    props = {
      currentTime: new Date().getTime(),
      mapTranslationStart: this.variables.mapTranslationStart,
      mapTranslationStartTime: this.variables.mapTranslationStartTime,
      mapTranslation: this.state.mapTranslation,
      atWall: this.variables.atWall
    }
  ) {
    if (props.atWall === true || this.state.paused === true) {
      return this.state.mapTranslation;
    } else {
      return (
        props.mapTranslationStart -
        (props.currentTime - props.mapTranslationStartTime) * SCROLL_SPEED
      );
    }
  }

  // return the y value of the sprite given current state of the game
  getY(
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
    } else if (props.jumpState === jump.DOWN) {
      return (
        props.yStart +
        0.5 * (props.currentTime - props.descendStartTime) ** 2 * JUMP_SPEED
      );
    } else if (props.jumpState === jump.UP) {
      return (
        props.yStart -
        ((props.currentTime - props.jumpStartTime) * JUMP_POWER -
          0.5 * (props.currentTime - props.jumpStartTime) ** 2 * JUMP_SPEED)
      );
    }
  }

  // unfortunately this breaks something!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  spriteAtWall(props) {
    // declare local variables
    const {
      currentTime,
      y,
      mapTranslation,
      yStart,
      x,
      descendStartTime,
      jumpState,
      jumpStartTime,
      atWall,
      mapTranslationStart,
      mapTranslationStartTime
    } = props;

    if (jumpState === jump.UP) {
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
      const peakTime = JUMP_POWER / JUMP_SPEED + jumpStartTime;
      if (
        this.getY({
          currentTime: peakTime,
          descendStartTime: descendStartTime,
          jumpStartTime: jumpStartTime,
          jumpState: jumpState,
          yStart: yStart,
          y: y
        }) >
        wall[1] - SPRITE_SIDE
      ) {
        return { time: peakTime, event: 'fall' };
      } else {
        return {
          time: this.getTimeForGivenY({
            yStart: yStart,
            y: wall[1] - SPRITE_SIDE,
            descendStartTime: descendStartTime,
            jumpState: jumpState,
            jumpStartTime: jumpStartTime,
            currentTime: currentTime
          }),
          event: 'go'
        };
      }
    } else {
      // (this.jumpState === jump.DOWN)
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
        time: this.getTimeForGivenY({
          yStart: yStart,
          y: wall[2],
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          currentTime: currentTime
        }),
        event: 'go'
      };
      const timeToLand = this.findPath({
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
      if (!timeToLand || timeToLand.time > timeToEscape.time) {
        return timeToEscape;
      } else {
        return timeToLand;
      }
    }
  }

  findNextChange() {
    // declare local variables
    let currentTime = new Date().getTime();
    let y = this.getY();
    let mapTranslation = this.getMapTranslation();
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

    // don't do anything if the character isn't moving
    if (jumpState !== jump.STOP || atWall === false) {
      if (atWall === true) {
        /*
        3 options:
          1. we jump over the wall
          2. we fall until we are below the wall
          3. we fall until we hit the ground
        */
        return this.spriteAtWall({
          currentTime: currentTime,
          y: y,
          yStart: yStart,
          x: x,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          atWall: atWall,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime
        });
      } else if (jumpState === jump.STOP) {
        // (this.AtWall === false)
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
        const pathEnd = this.getX({
          currentTime: endOfPath.time,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall
        });
        //console.log(endOfPath);

        const wall = this.findWall({
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

        const jumpEndX = this.getX({
          currentTime: jumpEndTime,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall
        });

        const wall = this.findWall({
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
      } else {
        // (this.jumpState === jump.DOWN) we're falling so we might either get blocked or stop falling

        const maxX =
          this.getX({
            currentTime: this.getTimeForGivenY({
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

        const wall = this.findWall({
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

        const path = this.findPath({
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
      }
    }
  }

  // generates and updates this.variables.motionChange
  updateChangeMotion() {
    this.variables.motionChange = this.findNextChange();
  }

  // sets gameStartTime and starts the necessary animation loops
  startLoops() {
    const currentTime = new Date().getTime();
    this.variables.gameStartTime = currentTime;
    this.variables.mapTranslationStartTime = currentTime;

    this.updateChangeMotion();

    this.renderInterval = setInterval(() => {
      if (this.variables.motionChange && this.state.paused === false) {
        if (this.getX() >= this.mapLength - 666) {
          // 666 is a bad constant and should be declared elsewhere!
          this.endGame();
        } else {
          this.setState({
            mapTranslation: this.getMapTranslation(),
            y: this.getY()
          });
        }
      }
    }, RENDER_TIMEOUT);

    this.updateInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      if (
        this.variables.motionChange &&
        this.variables.motionChange.time - currentTime < 0 &&
        this.state.paused === false
      ) {
        if (this.variables.motionChange.event === 'block') {
          //console.log('block');
          this.setState({
            mapTranslation: this.getMapTranslation({
              currentTime: this.variables.motionChange.time,
              mapTranslationStart: this.variables.mapTranslationStart,
              mapTranslationStartTime: this.variables.mapTranslationStartTime,
              mapTranslation: this.state.mapTranslation,
              atWall: this.variables.atWall
            })
          });
          this.variables.atWall = true;
          this.variables.mapTranslationStart = this.getMapTranslation();
        } else if (this.variables.motionChange.event === 'go') {
          //console.log('go');
          this.variables.mapTranslationStartTime = new Date().getTime();
          this.variables.atWall = false;
        } else if (this.variables.motionChange.event === 'land') {
          //console.log('land');
          this.setState({
            y:
              this.getY({
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
          this.variables.yStart = this.getY();
        } else {
          // this.variables.motionChange.event === 'fall'
          //console.log('fall');
          this.variables.yStart = this.getY();
          this.variables.jumpState = jump.DOWN;
          this.variables.descendStartTime = new Date().getTime();
        }
        this.updateChangeMotion();
      }
    }, UPDATE_TIMEOUT);
  }

  componentWillUnmount() {
    // prevent memory leak by clearing/stopping loops
    clearInterval(this.renderInterval);
    clearInterval(this.updateInterval);
    clearInterval(this.bufferInterval);
  }

  componentDidMount() {
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
        // should probably be a assign to a variable so it can be cleared see componentWillUnmount()
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

/*
findNextChange() {
    // declare local variables
    let currentTime = new Date().getTime();
    let y = this.getY();
    let mapTranslation = this.getMapTranslation();
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

    // don't do anything if the character isn't moving
    if (jumpState !== jump.STOP || atWall === false) { 
      if (atWall === true) {
        
        3 options:
          1. we jump over the wall
          2. we fall until we are below the wall
          3. we fall until we hit the ground
        
        
       if (jumpState === jump.UP) {
        let currentX = Math.round(x - mapTranslationStart);
        let found = false;
        let wall;
        while (!found) {
          const locations = this.map[currentX];
          for (let j = 0; j < locations.length; j++) {
            if (locations[j][0] === 'b') { // need to add a case where there are two wall with the same x value
              wall = locations[j];
              found = true;
            }
          }
          currentX++;
        }
        const peakTime = JUMP_POWER / JUMP_SPEED + jumpStartTime;
        if (
          this.getY({
            currentTime: peakTime,
            descendStartTime: descendStartTime,
            jumpStartTime: jumpStartTime,
            jumpState: jumpState,
            yStart: yStart,
            y: y
          }) >
          wall[1] - SPRITE_SIDE
        ) {
          return { time: peakTime, event: 'fall' };
        } else {
          return {
            time: this.getTimeForGivenY({
              yStart: yStart,
              y: wall[1] - SPRITE_SIDE,
              descendStartTime: descendStartTime,
              jumpState: jumpState,
              jumpStartTime: jumpStartTime,
              currentTime: currentTime
            }),
            event: 'go'
          };
        }
      } else { // (this.jumpState === jump.DOWN)
        let currentX = Math.round(x - mapTranslationStart);
        let found = false;
        let wall;
        while (!found) {
          const locations = this.map[currentX];
          for (let j = 0; j < locations.length; j++) {
            if (locations[j][0] === 'b') { // need to add a case where there are two wall with the same x value
              wall = locations[j];
              found = true;
            }
          }
          currentX++;
        }
        const timeToEscape = {
          time: this.getTimeForGivenY({
            yStart: yStart,
            y: wall[2],
            descendStartTime: descendStartTime,
            jumpState: jumpState,
            jumpStartTime: jumpStartTime,
            currentTime: currentTime
          }),
          event: 'go'
        };
        const timeToLand = this.findPath({
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
        if (!timeToLand || timeToLand.time > timeToEscape.time) {
          return timeToEscape;
        } else {
          return timeToLand;
        }
      }
    }
    else if (jumpState === jump.STOP) { // (this.AtWall === false)
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
      const pathEnd = this.getX({
        currentTime: endOfPath.time,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        mapTranslation: mapTranslation,
        atWall: atWall
      });
      //console.log(endOfPath);

      const wall = this.findWall({
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

      const jumpEndX = this.getX({
        currentTime: jumpEndTime,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        mapTranslation: mapTranslation,
        atWall: atWall
      });

      const wall = this.findWall({
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
    } else { // (this.jumpState === jump.DOWN) we're falling so we might either get blocked or stop falling


      const maxX =
        this.getX({
          currentTime: this.getTimeForGivenY({
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

      const wall = this.findWall({
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

      const path = this.findPath({
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
    }
  }
}
*/
