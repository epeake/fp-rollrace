import React from 'react';

const MENU_HEIGHT = 550;
const MENU_WIDTH = 700;

export default function ChangeKeyMenu(props) {
  // TODO: THIS LOOKS UGLY SO WE NEED TO RETHINK WITH ASPECT RATIO
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
      <text
        x={(window.innerWidth - MENU_WIDTH / 2) / 2 + 300}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 300}
      >
        Press New Jump Key
      </text>
      <text
        x={(window.innerWidth - MENU_WIDTH / 2) / 2 + 300}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 360}
      >
        {`Current Key: ${
          props.jumpKey === 32
            ? 'SPACE'
            : String.fromCharCode(props.jumpKey).toUpperCase()
        }`}
      </text>
      />
    </g>
  );
}
