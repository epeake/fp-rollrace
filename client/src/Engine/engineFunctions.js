import { CONSTANTS } from './constants.js';

/*
 * Outputs the time when the sprite will reach the given y value given the state of the game from props
 *   comes from solving the distance function in getY for time 
 * @params: props: {
            yStart: ,
            y: ,
            descendStartTime: ,
            jumpState: ,
            jumpStartTime: ,
            currentTime: ,
          }
 * @outputs: time (an integer I think)
 */
const getTimeForGivenY = props => {
  if (props.jumpState === CONSTANTS.jump.DOWN) {
    return (
      Math.sqrt((-props.yStart + props.y) / (0.5 * CONSTANTS.JUMP_SPEED)) +
      props.descendStartTime
    );
  } else if (props.jumpState === CONSTANTS.jump.UP) {
    return (
      (-Math.sqrt(
        CONSTANTS.JUMP_POWER ** 2 +
          2 * props.y * CONSTANTS.JUMP_SPEED -
          2 * CONSTANTS.JUMP_SPEED * props.yStart
      ) +
        CONSTANTS.JUMP_POWER +
        props.jumpStartTime * CONSTANTS.JUMP_SPEED) /
      CONSTANTS.JUMP_SPEED
    );
  } else {
    console.log('returning undefined');
    return undefined;
  }
};

/*
 * Outputs the time when the sprite will reach the given x value given the state of the game from props
 *   comes from solving the distance function in getX for time 
 * @params: props: {
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            atWall: ,
            x: ,
            xOffset: ,
          }
 * @outputs: time (an integer I think)
 */
const getTimeForGivenX = props => {
  if (props.atWall) {
    console.error("trying to calculate arrival time when sprite isn't moving");
    return undefined;
  } else {
    return (
      (props.mapTranslationStart - props.xOffset + props.x) /
        CONSTANTS.SCROLL_SPEED +
      props.mapTranslationStartTime
    );
  }
};

/*
 * Outputs the mapTranslation value of the sprite given a current state of the game
 * @params: props: {
            currentTime: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            mapTranslation: ,
            atWall: ,
            paused: ,
          }
 * @outputs: mapTranslation (an integer) (usually negative)
 */
const getMapTranslation = props => {
  if (props.atWall || props.paused) {
    return props.mapTranslation;
  } else {
    return (
      props.mapTranslationStart -
      (props.currentTime - props.mapTranslationStartTime) *
        CONSTANTS.SCROLL_SPEED
    );
  }
};

/*
 * Outputs the x value of the sprite given a current state of the game
 * @params: props: {
            currentTime: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            mapTranslation: ,
            atWall: ,
            x: ,
            paused: 
          }
 * @outputs: x (an integer)
 */
const getX = props => {
  return (
    props.x -
    getMapTranslation({
      currentTime: props.currentTime,
      mapTranslationStart: props.mapTranslationStart,
      mapTranslationStartTime: props.mapTranslationStartTime,
      mapTranslation: props.mapTranslation,
      atWall: props.atWall,
      paused: props.paused
    })
  );
};

/*
 * Outputs the y value of the sprite given a current state of the game
 * @params: props: {
        currentTime: ,
        descendStartTime: ,
        jumpStartTime: ,
        jumpState: ,
        yStart: ,
        y: ,
        paused: ,
      }
 * @outputs: y (an integer)
 */
const getY = props => {
  if (props.jumpState === CONSTANTS.jump.STOP || props.paused) {
    return props.y;
  } else if (props.jumpState === CONSTANTS.jump.DOWN) {
    return (
      props.yStart +
      0.5 *
        (props.currentTime - props.descendStartTime) ** 2 *
        CONSTANTS.JUMP_SPEED
    );
  } else if (props.jumpState === CONSTANTS.jump.UP) {
    return (
      props.yStart -
      ((props.currentTime - props.jumpStartTime) * CONSTANTS.JUMP_POWER -
        0.5 *
          (props.currentTime - props.jumpStartTime) ** 2 *
          CONSTANTS.JUMP_SPEED)
    );
  }
};

/*
 * Outputs whether or not the given y variable sets the sprite within the bounds of the wall
 * @params: location: an element of the map array
 *          y: the y location of the upper side of the sprite
 * @outputs: boolean
 */
const checkAtWall = (location, y) => {
  return (
    location[0] === 'b' &&
    ((location[1] <= y && y <= location[2]) ||
      (location[1] <= y + CONSTANTS.SPRITE_SIDE &&
        y + CONSTANTS.SPRITE_SIDE <= location[2]))
  );
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is moving)
 *  telling the time of collision
 * @params: props: {
            mapTranslation: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            maxX: ,
            descendStartTime: ,
            jumpStartTime: ,
            jumpState: ,
            yStart: ,
            y: ,
            atWall: ,
            x: ,
            strokeWidth: ,
            map: ,
            paused: 
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const findWall = props => {
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
    atWall,
    x,
    strokeWidth,
    map,
    paused
  } = props;

  let currentX = Math.round(
    x + CONSTANTS.SPRITE_SIDE - strokeWidth - mapTranslation
  );

  for (currentX; currentX <= maxX; currentX++) {
    const locations = map[currentX];
    for (let j = 0; j < locations.length; j++) {
      const newY = getY({
        currentTime: getTimeForGivenX({
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          atWall: atWall,
          x: currentX - CONSTANTS.SPRITE_SIDE,
          xOffset: x
        }),
        descendStartTime: descendStartTime,
        jumpStartTime: jumpStartTime,
        jumpState: jumpState,
        yStart: yStart,
        y: y,
        paused: paused
      });

      if (locations[j][0] === 'b' && checkAtWall(locations[j], newY)) {
        return {
          time: getTimeForGivenX({
            mapTranslationStart: mapTranslationStart,
            mapTranslationStartTime: mapTranslationStartTime,
            atWall: atWall,
            x: currentX - CONSTANTS.SPRITE_SIDE,
            xOffset: x
          }),
          event: 'block'
        };
      }
    }
  }
  // no wall found
  return undefined;
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is falling)
 *  telling the time of landing
 * @params: props: {
            currentTime: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            mapTranslation: ,
            atWall: ,
            yStart: ,
            descendStartTime: ,
            jumpState: ,
            jumpStartTime: ,
            maxX: ,
            x: ,
            minY: ,
            map: ,
            paused: ,
            strokeWidth: ,
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const findPath = props => {
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
    maxX,
    x,
    minY,
    map,
    paused,
    strokeWidth
  } = props;

  let currentX = Math.round(x - mapTranslation);
  let highest = minY;

  for (currentX; currentX <= maxX; currentX++) {
    const locations = map[currentX];
    for (let j = 0; j < locations.length; j++) {
      if (locations[j][1] - CONSTANTS.SPRITE_SIDE < highest) {
        // the time when the sprite will reach the path
        const time = getTimeForGivenY({
          yStart: yStart,
          y: locations[j][1] - CONSTANTS.SPRITE_SIDE,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          currentTime: currentTime
        });

        // the x position of the back of the sprite at the given time
        const xBack = getX({
          currentTime: time,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall,
          x: x,
          paused: paused
        });

        // the x position of the front of the sprite at the given time
        let xFront = xBack + CONSTANTS.SPRITE_SIDE;

        // special case if the sprite is at a wall
        if (atWall) {
          xFront = xFront - strokeWidth;
        }
        if (xBack <= currentX && currentX <= xFront) {
          highest = locations[j][1] - CONSTANTS.SPRITE_SIDE;
        }
      }
    }
  }
  // if path found
  if (highest !== minY) {
    return {
      time: getTimeForGivenY({
        yStart: yStart,
        y: highest,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        currentTime: currentTime
      }),
      event: 'land'
    };
  }
  // no path found
  else {
    return undefined;
  }
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is on a path)
 *  telling the time of falling off the path
 * @params: props: {
            mapTranslation: ,
            y: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            atWall: ,
            x: ,
            mapLength: ,
            map: ,
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const findEndOfPath = props => {
  // declare local variables
  const {
    mapTranslation,
    y,
    mapTranslationStart,
    mapTranslationStartTime,
    atWall,
    x,
    mapLength,
    map
  } = props;

  let currentX = Math.round(x - mapTranslation);
  let foundPathStart = false; // whether or not we have found the start of the current path

  for (currentX; currentX <= mapLength; currentX++) {
    const locations = map[currentX];
    let found = false; // whether we have found part of the current path this iteration
    for (let j = 0; j < locations.length; j++) {
      if (
        !foundPathStart &&
        Math.abs(locations[j][1] - (y + CONSTANTS.SPRITE_SIDE)) <
          CONSTANTS.PATH_THRESH
      ) {
        foundPathStart = true;
      }
      if (
        locations[j][0] === 'b' ||
        (locations[j][0] === 'h' &&
          Math.abs(locations[j][1] - (y + CONSTANTS.SPRITE_SIDE)) <
            CONSTANTS.PATH_THRESH) ||
        !foundPathStart
      ) {
        found = true;
      }
    }
    // this occurs if we fail to find an x value on the path.
    //   thus we have found the end of the path
    if (!found) {
      return {
        time: getTimeForGivenX({
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          atWall: atWall,
          x: currentX,
          xOffset: x
        }),
        event: 'fall'
      };
    }
  }
  // we should never not find the end of the path
  console.error('failed to find end of path');
  return undefined;
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is at a wall)
 *
 * @params: props: {
            currentTime: ,
            y: ,
            yStart: ,
            descendStartTime: ,
            jumpState: ,
            jumpStartTime: ,
            atWall: ,
            mapTranslation: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            x: ,
            map: ,
            minY: minY,
            paused: ,
            strokeWidth: ,
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const spriteAtWall = props => {
  // declare local variables
  const {
    currentTime,
    y,
    mapTranslation,
    yStart,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime,
    x,
    map,
    minY,
    paused,
    strokeWidth
  } = props;

  let currentX = Math.round(x - mapTranslation) + CONSTANTS.SPRITE_SIDE;
  let found = false;
  let wall;
  // find the wall the sprite is at
  while (!found) {
    const locations = map[currentX];
    for (let j = 0; j < locations.length; j++) {
      // need to add a case where there are two wall with the same x value
      if (locations[j][0] === 'b') {
        wall = locations[j];
        found = true;
      }
    }
    currentX++;
  }

  if (jumpState === CONSTANTS.jump.UP) {
    const peakTime =
      CONSTANTS.JUMP_POWER / CONSTANTS.JUMP_SPEED + jumpStartTime;
    if (
      getY({
        currentTime: peakTime,
        descendStartTime: descendStartTime,
        jumpStartTime: jumpStartTime,
        jumpState: jumpState,
        yStart: yStart,
        y: y,
        paused: paused
      }) >
      wall[1] - CONSTANTS.SPRITE_SIDE - strokeWidth
    ) {
      return { time: peakTime, event: 'fall' };
    } else {
      return {
        time: getTimeForGivenY({
          yStart: yStart,
          y: wall[1] - CONSTANTS.SPRITE_SIDE - strokeWidth,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          currentTime: currentTime
        }),
        event: 'go'
      };
    }
  }
  // (jumpState === jump.DOWN)
  else {
    // the time when the sprite will drop below the wall and start to move again
    const timeToEscape = {
      time: getTimeForGivenY({
        yStart: yStart,
        y: wall[2],
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        currentTime: currentTime
      }),
      event: 'go'
    };

    // the time the sprite will land on a path
    const timeToLand = findPath({
      currentTime: currentTime,
      mapTranslationStart: mapTranslationStart,
      mapTranslationStartTime: mapTranslationStartTime,
      mapTranslation: mapTranslation,
      atWall: atWall,
      yStart: yStart,
      descendStartTime: descendStartTime,
      jumpState: jumpState,
      jumpStartTime: jumpStartTime,
      maxX: currentX + CONSTANTS.SPRITE_SIDE,
      x: x,
      minY: minY,
      map: map,
      paused: paused,
      strokeWidth: strokeWidth
    });
    if (!timeToLand || timeToLand.time > timeToEscape.time) {
      return timeToEscape;
    } else {
      return timeToLand;
    }
  }
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is traveling along a path)
 *
 * @params: props: {
            y: ,
            yStart: ,
            descendStartTime: ,
            jumpState: ,
            jumpStartTime: ,
            atWall: ,
            mapTranslation: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            x: ,
            mapLength: ,
            paused: ,
            strokeWidth: ,
            map: ,
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const spriteOnFlat = props => {
  // declare local variables
  const {
    y,
    mapTranslation,
    yStart,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime,
    x,
    mapLength,
    paused,
    strokeWidth,
    map
  } = props;

  // a motionChange object for when to fall off the path
  const endOfPath = findEndOfPath({
    mapTranslation: mapTranslation,
    y: y,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    atWall: atWall,
    x: x,
    mapLength: mapLength,
    map: map
  });

  // the x value of the end of the path
  const pathEnd = getX({
    currentTime: endOfPath.time,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall,
    x: x,
    paused: paused
  });

  // a motionChange object for a wall that will block the app while on the path (if one exists)
  const wall = findWall({
    mapTranslation: mapTranslation,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    maxX: pathEnd + CONSTANTS.SPRITE_SIDE,
    descendStartTime: descendStartTime,
    jumpStartTime: jumpStartTime,
    jumpState: jumpState,
    yStart: yStart,
    y: y,
    atWall: atWall,
    x: x,
    strokeWidth: strokeWidth,
    map: map,
    paused: paused
  });

  // if there is a wall then stop at the wall (else the sprite will fall off the path)
  if (wall) {
    return wall;
  } else {
    return endOfPath;
  }
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite freely ascending)
 *
 * @params: props: {
            y: ,
            yStart: ,
            descendStartTime: ,
            jumpState: ,
            jumpStartTime: ,
            atWall: ,
            mapTranslation: ,
            mapTranslationStart: ,
            mapTranslationStartTime: ,
            strokeWidth: ,
            map: ,
            paused: ,
            x: ,
          }
 * @outputs: { time: , event: , } a motionChange object
 */
const spriteGoingUp = props => {
  // declare local variables
  const {
    y,
    mapTranslation,
    yStart,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime,
    strokeWidth,
    map,
    paused,
    x
  } = props;

  // the time when the sprite will start to fall
  const jumpEndTime =
    CONSTANTS.JUMP_POWER / CONSTANTS.JUMP_SPEED + jumpStartTime;

  // the x location when the sprite starts to fall
  const jumpEndX = getX({
    currentTime: jumpEndTime,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall,
    x: x,
    paused: paused
  });

  // a motionChange object of the soonest wall the sprite will hit
  const wall = findWall({
    mapTranslation: mapTranslation,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    maxX: jumpEndX,
    descendStartTime: descendStartTime,
    jumpStartTime: jumpStartTime,
    jumpState: jumpState,
    yStart: yStart,
    y: y,
    atWall: atWall,
    x: x,
    strokeWidth: strokeWidth,
    map: map,
    paused: paused
  });

  // check to see if wall is defined meaning the sprite will hit a wall before it falls
  if (wall) {
    return wall;
  } else {
    return { time: jumpEndTime, event: 'fall' };
  }
};

/*
 * Outputs a motionChange object based on the game state passed as props (assuming the sprite is in freefall)
 *
 * @params: props: {
              currentTime: ,
              minY: ,
              y: ,
              yStart: ,
              descendStartTime: ,
              jumpState: ,
              jumpStartTime: ,
              atWall: ,
              mapTranslation: ,
              mapTranslationStart: ,
              mapTranslationStartTime: ,
              strokeWidth: ,
              map: ,
              paused: ,
              x: ,
            }
 * @outputs: { time: , event: , } a motionChange object
 */
const spriteGoingDown = props => {
  // declare local variables
  const {
    currentTime,
    minY,
    y,
    mapTranslation,
    yStart,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime,
    strokeWidth,
    map,
    paused,
    x
  } = props;

  // determines a maxX value that the sprite will never go beyond as to not need
  //  to search the whole map
  const maxX =
    getX({
      currentTime: getTimeForGivenY({
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
      atWall: atWall,
      x: x,
      paused: paused
    }) + CONSTANTS.SPRITE_SIDE;

  // finds the soonest wall the sprite is going to hit
  const wall = findWall({
    mapTranslation: mapTranslation,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    maxX: maxX,
    descendStartTime: descendStartTime,
    jumpStartTime: jumpStartTime,
    jumpState: jumpState,
    yStart: yStart,
    y: y,
    atWall: atWall,
    x: x,
    strokeWidth: strokeWidth,
    map: map,
    paused: paused
  });

  // finds the soonest path the sprite is going to land on
  const path = findPath({
    currentTime: currentTime,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall,
    yStart: yStart,
    descendStartTime: descendStartTime,
    jumpState: jumpState,
    jumpStartTime: jumpStartTime,
    maxX: maxX,
    x: x,
    minY: minY,
    map: map,
    paused: paused,
    strokeWidth: strokeWidth
  });

  if (wall && path) {
    // if they are both defined then return the earlier one
    if (path.time <= wall.time) {
      return path;
    } else {
      return wall;
    }
  } else if (wall) {
    // otherwise return the defined one
    return wall;
  } else if (path) {
    return path;
  } else {
    // we should never have a scenario where neither is defined
    console.error("didn't find a path and didn't find a wall");
  }
};

/*
 * Outputs a motionChange object based on the game state passed as props
 *
 * @params: props: {
 *          variables: ,
 *          state: ,
 *          strokeWidth: ,
 *          map: ,
 *          mapLength: ,
 *          }
 * @outputs: { time: , event: , } motionChange object
 */

const findNextChange = props => {
  // declare local variables
  const {
    yStart,
    minY,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime,
    x
  } = props.variables;
  const currentTime = new Date().getTime();
  const y = getY({
    currentTime: new Date().getTime(),
    descendStartTime: descendStartTime,
    jumpStartTime: jumpStartTime,
    jumpState: jumpState,
    yStart: yStart,
    y: props.state.y,
    paused: props.state.paused
  });
  const mapTranslation = getMapTranslation({
    currentTime: new Date().getTime(),
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: props.state.mapTranslation,
    atWall: atWall,
    paused: props.state.paused
  });

  // don't do anything if the character isn't moving
  if (jumpState !== CONSTANTS.jump.STOP || !atWall) {
    if (atWall) {
      /*
       * 3 options:
       *  1. the sprite jumps over the wall
       *  2. the sprite falls until it is below the wall then it moves past the wall
       *  3. the sprite falls until it hits the ground
       */
      return spriteAtWall({
        currentTime: currentTime,
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        x: x,
        map: props.map,
        minY: minY,
        paused: props.state.paused,
        strokeWidth: props.strokeWidth
      });
    }
    // (!atWall)
    else if (jumpState === CONSTANTS.jump.STOP) {
      /*
       * 2 options:
       *  1. the sprite hits a wall
       *  2. the sprite falls off the path
       */
      return spriteOnFlat({
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        x: x,
        mapLength: props.mapLength,
        paused: props.state.paused,
        strokeWidth: props.strokeWidth,
        map: props.map
      });
    } else if (jumpState === CONSTANTS.jump.UP) {
      /*
       * 2 options:
       *  1. the sprite reaches max height and starts to fall down
       *  2. the sprite hits a wall while going up
       */
      return spriteGoingUp({
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        strokeWidth: props.strokeWidth,
        map: props.map,
        paused: props.state.paused,
        x: x
      });
    }
    // (jumpState === jump.DOWN)
    else {
      /*
       * 2 options:
       *  1. the sprite lands on a path
       *  2. the sprite hits a wall while going down
       */
      return spriteGoingDown({
        currentTime: currentTime,
        minY: minY,
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime,
        strokeWidth: props.strokeWidth,
        map: props.map,
        paused: props.state.paused,
        x: x
      });
    }
    // the sprite is stopped at a wall
  } else {
    return { time: undefined, event: 'nothing' };
  }
};

export { getX, getY, getMapTranslation, findNextChange };
