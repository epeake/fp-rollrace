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
    <ModalProvider>
      <StyledModal isOpen={props.showModal}>
        <StyledP>Game Over!</StyledP>
        <StyledP>{`Score: ${props.score}`}</StyledP>
        <StyledP>{`Highscore: ${props.highscore}`}</StyledP>
        <ModalStyledButton onClick={props.restart}>Restart</ModalStyledButton>
        <ModalStyledButton onClick={props.exitToMenu}>
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
