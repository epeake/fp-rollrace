/*
 * This is the svg for our pause button in the game.  Clicking the button fires
 * handleClick function passed in props.
 */

import React from 'react';
import PropTypes from 'prop-types';

export default function PauseButton(props) {
  return (
    <g onClick={props.handleClick}>
      <rect
        key={'pause-bkrnd'}
        rx={15}
        ry={15}
        x={props.x - 25}
        y={15}
        height={50}
        width={50}
        fill={'white'}
      />
      <rect
        key={'lft-line'}
        rx={5}
        ry={5}
        x={props.x - 12}
        y={28}
        height={25}
        width={10}
        fill={'black'}
      />
      <rect
        key={'rt-line'}
        rx={5}
        ry={5}
        x={props.x + 3}
        y={28}
        height={25}
        width={10}
        fill={'black'}
      />
    </g>
  );
}

PauseButton.propTypes = {
  handleClick: PropTypes.func.isRequired
};
