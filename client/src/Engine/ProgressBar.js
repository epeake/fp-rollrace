import React from 'react';
import PropTypes from 'prop-types';

const WIDTH = 200; // Set maximum width of progressbar
const HEIGHT = 20; // bar height
const POS_OFFSET = 35;
const SPRITE_OFFSET = 45;

const ProgressBar = props => {
  /*
    Finds how far the player is as perecntage of the entire path
    Translate that value to the distance from the start the sprite's icon will be on
    the progress bar.
    Currently it only supports single player mode.

    */
  const percentage = props.currX / props.pathLen;
  let currentPos = props.x + WIDTH * percentage;
  if (!currentPos) {
    currentPos = props.x;
  }

  return (
    <g>
      <rect
        fill={'#ffffff'}
        width={WIDTH}
        height={HEIGHT}
        x={props.x}
        y={props.y + POS_OFFSET}
      />

      {/* sprite 1 */}
      <ellipse
        fill={'#ff0000'}
        cx={currentPos} /*update player one position*/
        cy={props.y + SPRITE_OFFSET} /* offset */
        rx={2.0}
        ry={9.0}
      />

      {/* sprite 2 */}
      <ellipse
        fill={'#00ff00'}
        cx={currentPos} /*update player two position*/
        cy={props.y + SPRITE_OFFSET}
        rx={2.0}
        ry={9.0}
      />
    </g>
  );
};

ProgressBar.propTypes = {
  y: PropTypes.number.isRequired,
  currX: PropTypes.number,
  x: PropTypes.number.isRequired
};

export default ProgressBar;
