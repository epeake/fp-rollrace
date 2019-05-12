/*
 * This is the svg for our progress bar in the game.  Bar keeps track of the
 * player's current position relative to the end of the map.  Map (path) length
 * and current player position are passed as props as well as color.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CONSTANTS } from './Helpers/constants.js';

const ProgressBar = props => {
  const { currX, pathLen, spriteColor, x, y } = props;
  /*
    Finds how far the player is as perecntage of the entire path
    Translate that value to the distance from the start the sprite's icon will be on
    the progress bar.
    Currently it only supports single player mode.

  */
  const percentage = currX / pathLen;
  let currentPos = x + CONSTANTS.PROGRESS_BAR_WIDTH * percentage;
  if (!currentPos) {
    currentPos = x;
  }

  return (
    <g>
      <rect
        fill={'#ffffff'}
        width={CONSTANTS.PROGRESS_BAR_WIDTH}
        height={CONSTANTS.PROGRESS_BAR_HEIGHT}
        x={x}
        y={y + CONSTANTS.PROGRESS_BAR_POS_OFFSET}
      />

      {/* sprite 1 */}
      <ellipse
        fill={spriteColor}
        cx={currentPos} /*update player one position*/
        cy={y + CONSTANTS.PROGRESS_BAR_SPRITE_OFFSET} /* offset */
        rx={5.0}
        ry={15.0}
      />
    </g>
  );
};

ProgressBar.propTypes = {
  y: PropTypes.number.isRequired,
  currX: PropTypes.number,
  x: PropTypes.number.isRequired,
  spriteColor: PropTypes.string
};

export default ProgressBar;
