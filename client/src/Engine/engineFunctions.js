import { CONSTANTS } from './constants.js';

// detects a future wall and returns the time of collision
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
  return undefined;
};

// detects a future path and returns the time of landing
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
    paused
  } = props;

  let currentX = Math.round(x - mapTranslation);
  let highest = minY;

  for (currentX; currentX <= maxX; currentX++) {
    const locations = map[currentX];
    for (let j = 0; j < locations.length; j++) {
      if (
        locations[j][0] === 'h' &&
        locations[j][1] - CONSTANTS.SPRITE_SIDE < highest
      ) {
        const time = getTimeForGivenY({
          yStart: yStart,
          y: locations[j][1] - CONSTANTS.SPRITE_SIDE,
          descendStartTime: descendStartTime,
          jumpState: jumpState,
          jumpStartTime: jumpStartTime,
          currentTime: currentTime
        });
        const xBack = getX({
          currentTime: time,
          mapTranslationStart: mapTranslationStart,
          mapTranslationStartTime: mapTranslationStartTime,
          mapTranslation: mapTranslation,
          atWall: atWall,
          x: x,
          paused: paused
        });
        const xFront = xBack + CONSTANTS.SPRITE_SIDE;
        if (xBack <= currentX && currentX <= xFront) {
          highest = locations[j][1] - CONSTANTS.SPRITE_SIDE;
        }
      }
    }
  }

  if (highest !== minY) {
    // if path found
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
  } else {
    // no path found
    return undefined;
  }
};

// detects the end of the current path and returns the time of arrival
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
  let foundPath = false; // whether or not we have found the start of the current path

  for (currentX; currentX <= mapLength; currentX++) {
    const locations = map[currentX];
    let found = false;
    for (let j = 0; j < locations.length; j++) {
      if (
        !foundPath &&
        Math.abs(locations[j][1] - (y + CONSTANTS.SPRITE_SIDE)) <
          CONSTANTS.PATH_THRESH
      ) {
        foundPath = true;
      }
      if (
        locations[j][0] === 'b' ||
        (locations[j][0] === 'h' &&
          Math.abs(locations[j][1] - (y + CONSTANTS.SPRITE_SIDE)) <
            CONSTANTS.PATH_THRESH) ||
        !foundPath
      ) {
        found = true;
      }
    }
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
  return undefined;
};

// checks to see if a given y value matches a wall
const checkAtWall = (location, y) => {
  if (
    location[0] === 'b' &&
    ((location[1] <= y && y <= location[2]) ||
      (location[1] <= y + CONSTANTS.SPRITE_SIDE &&
        y + CONSTANTS.SPRITE_SIDE <= location[2]))
  ) {
    return true;
  }
  return false;
};

/*
 * return the time when the sprite will reach the given y value also given the state of the game
 * comes from solving the distance function in getY for time
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
 * return the time when the sprite will reach the given x value also given the state of the game
 * comes from solving the distance function in getX for time
 */
const getTimeForGivenX = props => {
  if (props.atWall) {
    console.log('return undefined');
    return undefined;
  } else {
    return (
      (props.mapTranslationStart - props.xOffset + props.x) /
        CONSTANTS.SCROLL_SPEED +
      props.mapTranslationStartTime
    );
  }
};

// return the x value of the sprite given current state of the game
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
   x = offset - mpastart + (time - starttime) * scroll
   (x - offset + mapstart) / scroll + starttime = time
*/

// return the mapTranslation value given current state of the game
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

// return the y value of the sprite given current state of the game
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

// determines what should happen when the sprite is stuck at a wall
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
    paused
  } = props;

  let currentX = Math.round(x - mapTranslation);
  let found = false;
  let wall;
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
      wall[1] - CONSTANTS.SPRITE_SIDE
    ) {
      return { time: peakTime, event: 'fall' };
    } else {
      return {
        time: getTimeForGivenY({
          yStart: yStart,
          y: wall[1] - CONSTANTS.SPRITE_SIDE,
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
      paused: paused
    });
    if (!timeToLand || timeToLand.time > timeToEscape.time) {
      return timeToEscape;
    } else {
      return timeToLand;
    }
  }
};

// determines what should happen when the sprite is moving along a path
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
  console.log({
    mapTranslation: mapTranslation,
    y: y,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    atWall: atWall,
    x: x,
    mapLength: mapLength,
    map: map
  });
  console.log(endOfPath);
  const pathEnd = getX({
    currentTime: endOfPath.time,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall,
    x: x,
    paused: paused
  });
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
  console.log(wall);

  if (!wall || endOfPath.time < wall.time) {
    return endOfPath;
  } else {
    return wall;
  }
};

// determines what should happen when the sprite is moving up
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
  const jumpEndTime =
    CONSTANTS.JUMP_POWER / CONSTANTS.JUMP_SPEED + jumpStartTime;

  const jumpEndX = getX({
    currentTime: jumpEndTime,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall,
    x: x,
    paused: paused
  });

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
  if (!wall || wall.time > jumpEndTime) {
    return { time: jumpEndTime, event: 'fall' };
  } else {
    return wall;
  }
};

// determines what should happen when the sprite is moving down
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
    paused: paused
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
    console.log('panic'); // this shouldn't happen
  }
};
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
        paused: props.state.paused
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
  } else {
    return { time: undefined, event: 'nothing' };
  }
};

export {
  findWall,
  findPath,
  findEndOfPath,
  checkAtWall,
  getTimeForGivenX,
  getTimeForGivenY,
  getX,
  getY,
  getMapTranslation,
  spriteAtWall,
  spriteOnFlat,
  spriteGoingUp,
  spriteGoingDown,
  findNextChange
};
