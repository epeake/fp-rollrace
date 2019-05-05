import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import request from 'request-promise-native';
import io from 'socket.io-client';
import { findMapSpan, buildMapHashtable } from './mapParser.js';
import PauseMenu from './Menus/PauseMenu.js';
import PauseButton from './PauseButton.js';
import GameoverMenu from './Menus/GameoverMenu.js';
import ChangeKeyMenu from './Menus/ChangeKeyMenu.js';
import ProgressBar from './ProgressBar.js';
import Map from './Map.js';
import Timer from './Timer.js';
import Tutorial from './Tutorial.js';

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
const UPDATE_INTERVAL = 20; // milliseconds
const TOOLBAR_Y = 15;
const TOOLBAR_X = 900;
const ICON_X = 40;
const GAMEOVER_X = 667;
const UPDATE_TIMEOUT = 20; // time between motionChange updates
const RENDER_TIMEOUT = 20; // time between rerenders
const JUMP_SPEED = 0.0013; // acceleration
const JUMP_POWER = 0.7; // jumping velocity
const SCROLL_SPEED = 0.4;
const SPRITE_SIDE = 50;
const PATH_THRESH = 5;
const TIME_THRESH = RENDER_TIMEOUT;

const INITIAL_STATE = {
  dataSent: false,
  tutorial: false,
  paused: false,
  gameover: false,
  jumpKey: 32, // space bar
  startKey: 115, // s key
  changingKey: false,
  timerCanStart: false,
  y: 600,
  mapTranslation: 0,
  hideMenu: false,
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
  yStart: INITIAL_STATE.y,
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

    this.state = Object.assign({}, INITIAL_STATE, {
      guest: this.props.guest,
      map: this.props.mapName,
      multi: this.props.multi,
      playercolor: this.props.playercolor,
      restart: false
    });

    this.restartMinutes = this.props.minutes;
    this.variables = Object.assign({}, INITIAL_VARIABLES);

    if (this.props.multi) {
      /*
       * each game will have a socket to connect back to the server
       * store the other players as a member for THIS player
       */
      this.socket = io.connect();
    }

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
    this.sendEndgameData = this.sendEndgameData.bind(this);
    this.findWall = this.findWall.bind(this);
    this.findPath = this.findPath.bind(this);
    this.findEndOfPath = this.findEndOfPath.bind(this);
    this.checkAtWall = this.checkAtWall.bind(this);
    this.getTimeForGivenY = this.getTimeForGivenY.bind(this);
    this.getTimeForGivenX = this.getTimeForGivenX.bind(this);
    this.getX = this.getX.bind(this);
    this.getMapTranslation = this.getMapTranslation.bind(this);
    this.getY = this.getY.bind(this);
    this.spriteAtWall = this.spriteAtWall.bind(this);
    this.spriteOnFlat = this.spriteOnFlat.bind(this);
    this.spriteGoingUp = this.spriteGoingUp.bind(this);
    this.spriteGoingDown = this.spriteGoingDown.bind(this);
    this.findNextChange = this.findNextChange.bind(this);
    this.startLoops = this.startLoops.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.timeOut = this.timeOut.bind(this);
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
    this.variables.yStart = this.getY();
    this.variables.jumpState = jump.UP;
    this.variables.jumpStartTime = new Date().getTime();
    (async () => {
      this.variables.motionChange = this.findNextChange();
    })();
  }

  // Changes our current jump key
  handleChangeJumpKey(event) {
    this.setState({ jumpKey: event.keyCode });
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
      !this.state.paused &&
      this.variables.gameStartTime
    ) {
      this.handleJumpKey();
    } else {
      void 0; // do nothing
    }
  }
  //startsgame after 3 seconds

  startCountdown() {
    if (!this.variables.gameStartTime) {
      setTimeout(this.startLoops, 3000);
    }
  }

  // Resets our current window dimentions
  handleWindowResize() {
    this.setState({
      windowHeight: window.innerHeight
    });
  }

  // restarts the game
  restartGame() {
    // clear loops
    clearTimeout(this.timeout);
    clearInterval(this.updateInterval);
    clearInterval(this.renderInterval);
    clearInterval(this.multiplayerInterval);

    /*
     * make sure window is correct size
     * (person may have changes window while playing so can't really make a default for it)
     */
    const restartState = Object.assign({}, INITIAL_STATE, {
      windowHeight: window.innerHeight,
      restart: true
    });
    this.variables = Object.assign(this.variables, INITIAL_VARIABLES);
    this.setState(restartState);
    this.startCountdown();
  }

  // resumes the game after being paused
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

  // pauses the game
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

  // send gameover data
  sendEndgameData() {
    const finishTime = parseInt(
      (new Date().getTime() -
        this.variables.gameStartTime -
        this.variables.timePaused) /
        1000
    );
    console.log(finishTime);

    if (
      !this.state.guest // exclusive to members
    ) {
      const options = {
        url: `${
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://rollrace.herokuapp.com'
        }/api/users/`,
        body: {
          type: 'end',
          contents: {
            time: finishTime
          }
        },
        json: true
      };

      request
        .put(options)
        .then(resp => {
          console.log(resp); // for debugging
          this.setState({ dataSent: true });
        })
        .catch(err => {
          throw Error(err);
        });
    } else {
      if (finishTime < this.state.guest.map_1) {
        // TODOOOO MAKE THIS NOT HARDCODEEEEE
        this.setState({
          dataSent: true,
          guest: Object.assign(this.state.guest, {
            map_1: finishTime,
            total_games: this.state.guest.total_games + 1
          })
        });
      } else {
        this.setState({
          dataSent: true,
          guest: Object.assign(this.state.guest, {
            total_games: this.state.guest.total_games + 1
          })
        });
      }
    }
  }

  // sets gameStartTime and starts the necessary animation loops
  startLoops() {
    this.setState({ timerCanStart: true });
    this.setState({ restart: false });
    this.variables.gameStartTime = new Date().getTime();
    this.variables.mapTranslationStartTime = new Date().getTime();
    (async () => {
      this.variables.motionChange = this.findNextChange();
    })();

    this.updateInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      const adjustedTime = this.variables.motionChange.time;
      if (
        this.variables.motionChange &&
        this.variables.motionChange.event !== 'nothing' &&
        adjustedTime - currentTime < TIME_THRESH &&
        !this.state.paused
      ) {
        //console.log(this.variables.motionChange.event);

        const y = this.getY({
          currentTime: adjustedTime,
          descendStartTime: this.variables.descendStartTime,
          jumpStartTime: this.variables.jumpStartTime,
          jumpState: this.variables.jumpState,
          yStart: this.variables.yStart,
          y: this.state.y
        });
        const mapTranslation = this.getMapTranslation({
          currentTime: adjustedTime,
          mapTranslationStart: this.variables.mapTranslationStart,
          mapTranslationStartTime: this.variables.mapTranslationStartTime,
          mapTranslation: this.state.mapTranslation,
          atWall: this.variables.atWall
        });
        if (this.variables.motionChange.event === 'block') {
          this.setState({
            mapTranslation: mapTranslation
          });
          this.variables.atWall = true;
        } else if (this.variables.motionChange.event === 'go') {
          this.variables.mapTranslationStart = mapTranslation;
          this.variables.mapTranslationStartTime = currentTime;
          this.variables.atWall = false;
        } else if (this.variables.motionChange.event === 'land') {
          this.setState({
            y: y - this.props.mapProps.strokeWidth / 2
          });
          this.variables.jumpState = jump.STOP;
        } else if (this.variables.motionChange.event === 'fall') {
          this.variables.descendStartTime = currentTime;
          this.variables.yStart = y;
          this.variables.jumpState = jump.DOWN;
        }
        this.variables.motionChange = undefined;
        (async () => {
          this.variables.motionChange = this.findNextChange();
        })();
      }
    }, UPDATE_TIMEOUT);

    this.renderInterval = setInterval(() => {
      if (this.variables.motionChange !== 'nothing' && !this.state.paused) {
        // 666 is a bad constant and should be declared elsewhere!
        if (this.getX() >= this.mapLength - GAMEOVER_X) {
          clearInterval(this.renderInterval);
          clearInterval(this.updateInterval);
          this.setState({
            gameover: true
          });
        } else {
          this.setState({
            mapTranslation: this.getMapTranslation(),
            y: this.getY()
          });
        }
      }
    }, RENDER_TIMEOUT);
  }

  componentDidUpdate() {
    if (this.state.gameover && !this.state.dataSent) {
      this.sendEndgameData();
    }
  }

  componentWillUnmount() {
    // prevent memory leak by clearing/stopping loops
    clearTimeout(this.timeout);
    clearInterval(this.updateInterval);
    clearInterval(this.renderInterval);
    if (this.props.multi) {
      this.socket.disconnect();
    }
  }

  componentDidMount() {
    this.startCountdown();

    if (this.state.multi) {
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
          color: 'black',
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
    this.handleWindowResize();
  }

  //Ends game when timer reaches zero
  timeOut() {
    this.setState({ gameover: true });
  }

  render() {
    const docBody = document.querySelector('body');
    docBody.addEventListener('keypress', e => this.handleKeyPress(e));

    window.addEventListener(
      'resize',
      this.debounce(this.handleWindowResize, 500)
    );

    const boxes = [
      <circle
        key={this.socket ? this.socket.id : '1'}
        cx={this.variables.x}
        cy={this.state.y}
        height={SPRITE_SIDE}
        width={SPRITE_SIDE}
        r={SPRITE_SIDE}
        fill={this.state.playercolor}
      />
    ];

    if (this.state.multi) {
      // now we need to account for other players that should be rendered
      if (this.state.players !== undefined) {
        // TODO: need unique key for players
        boxes.unshift(
          this.state.players.map(player => {
            return (
              <circle
                key={player.id}
                // this difference allows for other players
                // to be rendered at different places in the map
                // based on their x coordinate
                cx={this.getMapTranslation() - player.mapTrans + 200}
                cy={player.y}
                r={SPRITE_SIDE}
                fill={player.color}
                fill-opacity="0.4"
              />
            );
          })
        );
      }
    }

    //console.log(this.state.gameover)
    if (!this.state.tutorial) {
      return (
        <>
          {/* conditional rendering when the pause button is toggled */}
          {this.state.paused &&
            this.state.hideMenu &&
            this.state.changingKey && (
              <ChangeKeyMenu
                jumpKey={this.state.jumpKey}
                showMenu={() =>
                  this.setState({ changingKey: false, hideMenu: false })
                }
              />
            )}
          {/*Pause menu renders if the pause button is toggled and the changekey menu is not being displayed*/}
          {this.state.paused && !this.state.hideMenu && (
            <PauseMenu
              resume={() => this.resumeGame()}
              restart={() => this.restartGame()}
              changeKey={() =>
                this.setState({ changingKey: true, hideMenu: true })
              }
              goToMenu={this.props.goToMenu}
              gameOver={this.state.gameover}
            />
          )}

          <SVGLayer
            viewBox={'0 0 2000 5000'}
            preserveAspectRatio={'xMaxYMin slice'}
            height={this.state.windowHeight}
            width={this.state.windowHeight * 2}
          >
            {!this.state.gameover && (
              <Timer
                y={TOOLBAR_Y}
                x={TOOLBAR_X}
                pause={this.state.paused}
                multi={this.state.multi}
                timerCanStart={this.state.timerCanStart}
                boot={bool => this.setState({ gameover: bool })}
                restart={this.state.restart}
              />
            )}

            <ProgressBar y={TOOLBAR_Y} x={TOOLBAR_X} />
            <Map
              translation={this.state.mapTranslation}
              map={this.props.mapProps.map}
              stroke={this.props.mapProps.strokeWidth}
              className="map"
            />
            {boxes}
            <PauseButton
              x={ICON_X}
              handleClick={() => this.pauseGame()}
              className="pauseButton"
            />
            {/* tutorial used to be here */}
            <g>
              {/* player icon */}
              <circle
                cx={ICON_X}
                cy={TOOLBAR_Y + 100}
                height={SPRITE_SIDE}
                width={SPRITE_SIDE}
                r={SPRITE_SIDE / 2}
                fill={this.state.playercolor}
                className="icon"
              />
            </g>
          </SVGLayer>

          {this.state.dataSent ? (
            <SVGLayer
              viewBox={'0 0 2000 1000'}
              preserveAspectRatio={'xMinYMin meet'}
            >
              <GameoverMenu
                windowHeight={this.state.windowHeight}
                restart={() => this.restartGame()}
                exitToMenu={() => this.props.goToMenu()}
                guest={this.props.guest}
              />
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

/* tutorial:
 *<g onClick={() => this.pauseGame()}>
 *  <g onClick={() => this.setState({ tutorial: true })}>
 *    {' '}
 *    {/ pauses game because within pausing div/}
 *    <rect
 *      key={'help-me'}
 *      rx={15}
 *      ry={15}
 *      x={115}
 *      y={15}
 *      height={50}
 *      width={50}
 *      fill={'pink'}
 *    />
 *    <text x={135} y={45} height={50} width={50}>
 *      ?
 *    </text>
 *  </g>
 *</g>
 */

GameEngine.propTypes = {
  guest: PropTypes.object,
  mapProps: PropTypes.object.isRequired,
  multi: PropTypes.bool.isRequired,
  goToMenu: PropTypes.func.isRequired
};

export default GameEngine;
