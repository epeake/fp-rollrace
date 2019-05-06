import React from 'react';
import { ModalProvider } from 'styled-react-modal';
import StyledModal from './StyledModal.js';
import StyledButton from './StyledButton.js';
import PropTypes from 'prop-types';


const PauseMenu = props => {
  const { resume, restart, changeKey, goToMenu, showModal } = props;
  return (
    <ModalProvider>
      <StyledModal isOpen={showModal}>
        <StyledButton onClick={resume}>Resume</StyledButton>
        <StyledButton onClick={restart}>Restart</StyledButton>
        <StyledButton onClick={changeKey}> Change Key</StyledButton>
        <StyledButton onClick={goToMenu}>Main Menu</StyledButton>
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
