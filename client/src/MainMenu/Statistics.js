import React from 'react';
import PropTypes from 'prop-types';
import {
  MenuBackground,
  MenuTitle,
  MenuButton,
  MenuText
} from '../Style/MenuStyle.js';

export default function Statistics(props) {
  return (
    <MenuBackground>
      <MenuTitle> Stats </MenuTitle>
      <MenuButton onClick={props.goToMenu}>{'<-'} Main Menu </MenuButton>
      <MenuText>Total Games: {props.user.total_games}</MenuText>
      <MenuText>
        Best Map 1 Time:{' '}
        {props.user.map_1 === -1 || props.user.map_1 === Infinity
          ? 'N/A'
          : `${props.user.map_1} sec`}
      </MenuText>
    </MenuBackground>
  );
}

Statistics.propTypes = {
  goToMenu: PropTypes.func.isRequired
};
