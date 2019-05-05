// detects a future wall and returns the time of collision
export const findWall = props => {
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
    this.variables.x +
      SPRITE_SIDE -
      this.props.mapProps.strokeWidth -
      mapTranslation
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
};

// detects a future path and returns the time of landing
export const findPath = props => {
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
      if (locations[j][0] === 'h' && locations[j][1] - SPRITE_SIDE < highest) {
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
      event: 'land'
    };
  } else {
    // no path found
    return undefined;
  }
};

// detects the end of the current path and returns the time of arrival
export const findEndOfPath = props => {
  // declare local variables
  const {
    mapTranslation,
    y,
    mapTranslationStart,
    mapTranslationStartTime,
    atWall
  } = props;

  let currentX = Math.round(this.variables.x - mapTranslation);
  let foundPath = false; // whether or not we have found the start of the current path

  for (currentX; currentX <= this.mapLength; currentX++) {
    const locations = this.map[currentX];
    let found = false;
    for (let j = 0; j < locations.length; j++) {
      if (
        !foundPath &&
        Math.abs(locations[j][1] - (y + SPRITE_SIDE)) < PATH_THRESH
      ) {
        foundPath = true;
      }
      if (
        locations[j][0] === 'b' ||
        (locations[j][0] === 'h' &&
          Math.abs(locations[j][1] - (y + SPRITE_SIDE)) < PATH_THRESH) ||
        !foundPath
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
          x: currentX
        }),
        event: 'fall'
      };
    }
  }
  return undefined;
};

// checks to see if a given y value matches a wall
export const checkAtWall = (location, y) => {
  if (
    location[0] === 'b' &&
    ((location[1] <= y && y <= location[2]) ||
      (location[1] <= y + SPRITE_SIDE && y + SPRITE_SIDE <= location[2]))
  ) {
    return true;
  }
  return false;
};

/*
 * return the time when the sprite will reach the given y value also given the state of the game
 * comes from solving the distance function in getY for time
 */

export const getTimeForGivenY = props => {
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
};

/*
 * return the time when the sprite will reach the given x value also given the state of the game
 * comes from solving the distance function in getX for time
 */
export const getTimeForGivenX = props => {
  if (props.atWall) {
    console.log('return undefined');
    return undefined;
  } else {
    return (
      (props.mapTranslationStart - (this.variables.x - props.x)) /
        SCROLL_SPEED +
      props.mapTranslationStartTime
    );
  }
};

// return the x value of the sprite given current state of the game
export const getX = (
  props = {
    currentTime: new Date().getTime(),
    mapTranslationStart: this.variables.mapTranslationStart,
    mapTranslationStartTime: this.variables.mapTranslationStartTime,
    mapTranslation: this.state.mapTranslation,
    atWall: this.variables.atWall
  }
) => {
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
};

// return the mapTranslation value given current state of the game
export const getMapTranslation = (
  props = {
    currentTime: new Date().getTime(),
    mapTranslationStart: this.variables.mapTranslationStart,
    mapTranslationStartTime: this.variables.mapTranslationStartTime,
    mapTranslation: this.state.mapTranslation,
    atWall: this.variables.atWall
  }
) => {
  if (props.atWall || this.state.paused) {
    return this.state.mapTranslation;
  } else {
    return (
      props.mapTranslationStart -
      (props.currentTime - props.mapTranslationStartTime) * SCROLL_SPEED
    );
  }
};

// return the y value of the sprite given current state of the game
export const getY = (
  props = {
    currentTime: new Date().getTime(),
    descendStartTime: this.variables.descendStartTime,
    jumpStartTime: this.variables.jumpStartTime,
    jumpState: this.variables.jumpState,
    yStart: this.variables.yStart,
    y: this.state.y
  }
) => {
  if (props.jumpState === jump.STOP || this.state.paused) {
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
};

// determines what should happen when the sprite is stuck at a wall
export const spriteAtWall = props => {
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
    mapTranslationStartTime
  } = props;

  let currentX = Math.round(this.variables.x - mapTranslation);
  let found = false;
  let wall;
  while (!found) {
    const locations = this.map[currentX];
    for (let j = 0; j < locations.length; j++) {
      // need to add a case where there are two wall with the same x value
      if (locations[j][0] === 'b') {
        wall = locations[j];
        found = true;
      }
    }
    currentX++;
  }

  if (jumpState === jump.UP) {
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
  }
  // (this.jumpState === jump.DOWN)
  else {
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
};

// determines what should happen when the sprite is moving along a path
export const spriteOnFlat = props => {
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
    mapTranslationStartTime
  } = props;
  const endOfPath = this.findEndOfPath({
    mapTranslation: mapTranslation,
    y: y,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    atWall: atWall
  });
  const pathEnd = this.getX({
    currentTime: endOfPath.time,
    mapTranslationStart: mapTranslationStart,
    mapTranslationStartTime: mapTranslationStartTime,
    mapTranslation: mapTranslation,
    atWall: atWall
  });
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

  if (!wall || endOfPath.time < wall.time) {
    return endOfPath;
  } else {
    return wall;
  }
};

// determines what should happen when the sprite is moving up
export const spriteGoingUp = props => {
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
    mapTranslationStartTime
  } = props;
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
    return { time: jumpEndTime, event: 'fall' };
  } else {
    return wall;
  }
};

// determines what should happen when the sprite is moving down
export const spriteGoingDown = props => {
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
    mapTranslationStartTime
  } = props;
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
    console.log('panic'); // this shouldn't happen
  }
};
export const findNextChange = () => {
  // declare local variables
  const currentTime = new Date().getTime();
  const y = this.getY();
  const mapTranslation = this.getMapTranslation();

  const {
    yStart,
    minY,
    descendStartTime,
    jumpState,
    jumpStartTime,
    atWall,
    mapTranslationStart,
    mapTranslationStartTime
  } = this.variables;

  // don't do anything if the character isn't moving
  if (jumpState !== jump.STOP || !atWall) {
    if (atWall) {
      /*
       * 3 options:
       *  1. the sprite jumps over the wall
       *  2. the sprite falls until it is below the wall then it moves past the wall
       *  3. the sprite falls until it hits the ground
       */
      return this.spriteAtWall({
        currentTime: currentTime,
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime
      });
    }
    // (!this.AtWall)
    else if (jumpState === jump.STOP) {
      /*
       * 2 options:
       *  1. the sprite hits a wall
       *  2. the sprite falls off the path
       */
      return this.spriteOnFlat({
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime
      });
    } else if (jumpState === jump.UP) {
      /*
       * 2 options:
       *  1. the sprite reaches max height and starts to fall down
       *  2. the sprite hits a wall while going up
       */
      return this.spriteGoingUp({
        y: y,
        yStart: yStart,
        descendStartTime: descendStartTime,
        jumpState: jumpState,
        jumpStartTime: jumpStartTime,
        atWall: atWall,
        mapTranslation: mapTranslation,
        mapTranslationStart: mapTranslationStart,
        mapTranslationStartTime: mapTranslationStartTime
      });
    }
    // (this.jumpState === jump.DOWN)
    else {
      /*
       * 2 options:
       *  1. the sprite lands on a path
       *  2. the sprite hits a wall while going down
       */
      return this.spriteGoingDown({
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
        mapTranslationStartTime: mapTranslationStartTime
      });
    }
  } else {
    return { time: undefined, event: 'nothing' };
  }
};
