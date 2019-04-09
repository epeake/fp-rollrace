import React from 'react';

const MENU_HEIGHT = 700;
const MENU_WIDTH = 550;
const BUTTON_OFFSET = 80;
const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 300;

export default function Map(props) {
  return (
    <g>
      <rect
        x={0}
        y={0}
        height={4000}
        width={4000}
        fill={'black'}
        opacity={0.5}
      />
      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - MENU_WIDTH / 2) / 2}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4}
        height={MENU_HEIGHT}
        width={MENU_WIDTH}
        fill={'white'}
        opacity={1}
      />

      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - BUTTON_WIDTH / 2) / 2 + 55}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + BUTTON_OFFSET}
        height={BUTTON_HEIGHT}
        width={BUTTON_WIDTH}
        fill={'black'}
        opacity={1}
        onClick={() => props.resume()}
      />
    </g>
  );
}
