/*
 * This file contains the ChangeKeyMenu component, which is called from the
 * when the player is either booted, or reached the end of the map.
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { ModalProvider } from 'styled-react-modal';
import { StyledModal, ModalStyledButton } from '../../Style/ModalStyle.js';

const StyledP = styled.p`
  text-align: center;
  color: white;
  font-family: 'Gugi', cursive;
`;

export default function GameoverMenu(props) {
  return (
    <ModalProvider className="modalprovider">
      <StyledModal className="styledmodal" isOpen={props.showModal}>
        <StyledP className="prompt">Game Over!</StyledP>
        {/* only show the current score if the player actually completed the game */}
        {!props.wasBooted && (
          <StyledP className="score">{`Score: ${props.score} sec`}</StyledP>
        )}

        {/* only show the highscore if the player has one on file for the map */}
        {props.highscore !== -1 && (
          <StyledP className="highscore">{`Highscore: ${
            props.highscore
          } sec`}</StyledP>
        )}
        <ModalStyledButton className="restart" onClick={props.restart}>
          Restart
        </ModalStyledButton>
        <ModalStyledButton className="goToMenu" onClick={props.exitToMenu}>
          Main Menu
        </ModalStyledButton>
      </StyledModal>
    </ModalProvider>
  );
}

GameoverMenu.propTypes = {
  score: PropTypes.number,
  restart: PropTypes.func.isRequired,
  exitToMenu: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired
};
