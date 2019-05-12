/*
 * This file contains the PauseMenu, displayed after the user clicks the pause
 * button from within the game.
 */

import React from 'react';
import { ModalProvider } from 'styled-react-modal';
import PropTypes from 'prop-types';
import { StyledModal, ModalStyledButton } from '../../Style/ModalStyle.js';

const PauseMenu = props => {
  const { resume, restart, changeKey, goToMenu, showModal } = props;
  return (
    <ModalProvider>
      <StyledModal isOpen={showModal}>
        <ModalStyledButton className="resume" onClick={resume}>
          Resume
        </ModalStyledButton>
        <ModalStyledButton className="restart" onClick={restart}>
          Restart
        </ModalStyledButton>
        <ModalStyledButton className="changeKey" onClick={changeKey}>
          {' '}
          Change Key
        </ModalStyledButton>
        <ModalStyledButton className="goToMenu" onClick={goToMenu}>
          Main Menu
        </ModalStyledButton>
      </StyledModal>
    </ModalProvider>
  );
};

PauseMenu.propTypes = {
  resume: PropTypes.func.isRequired,
  restart: PropTypes.func.isRequired,
  changeKey: PropTypes.func.isRequired,
  goToMenu: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default PauseMenu;
