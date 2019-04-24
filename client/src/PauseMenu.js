import React from 'react';

const MENU_HEIGHT = 700;
const MENU_WIDTH = 550;
const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 300;

export default function Map(props) {
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

      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - BUTTON_WIDTH / 2) / 2 + 55}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 80}
        height={BUTTON_HEIGHT}
        width={BUTTON_WIDTH}
        fill={'black'}
        opacity={1}
        onClick={() => props.resume()}
      />

      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - BUTTON_WIDTH / 2) / 2 + 55}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 160}
        height={BUTTON_HEIGHT}
        width={BUTTON_WIDTH}
        fill={'red'}
        opacity={1}
        onClick={() => props.restart()}
      />

      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - BUTTON_WIDTH / 2) / 2 + 55}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 240}
        height={BUTTON_HEIGHT}
        width={BUTTON_WIDTH}
        fill={'green'}
        opacity={1}
        onClick={() => props.changeKey()}
      />

      <rect
        rx={30}
        ry={30}
        x={(window.innerWidth - BUTTON_WIDTH / 2) / 2 + 55}
        y={(window.innerHeight - MENU_HEIGHT / 2) / 4 + 320}
        height={BUTTON_HEIGHT}
        width={BUTTON_WIDTH}
        fill={'yellow'}
        opacity={1}
        onClick={props.goToMenu}
      />
    </g>
  );
}
