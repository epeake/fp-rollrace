import React from 'react';
import styled from 'styled-components';
import { ModalProvider } from 'styled-react-modal';
import PropTypes from 'prop-types';
import { StyledModal, ModalStyledButton } from '../../Style/ModalStyle.js';

const StyledP = styled.p`
  text-align: center;
  color: white;
  font-family: 'Gugi', cursive;
`;

const ChangeKeyMenu = props => {
  const { showMenu, jumpKey, showModal } = props;
  return (
    <ModalProvider>
      <StyledModal isOpen={showModal}>
        <StyledP>Press New jumpKey</StyledP>
        <StyledP>
          {`Current Key: ${
            jumpKey === 32
              ? 'SPACE'
              : String.fromCharCode(jumpKey).toUpperCase()
          }`}
        </StyledP>
        <ModalStyledButton onClick={showMenu}>Back</ModalStyledButton>
      </StyledModal>
    </ModalProvider>
  );
};

ChangeKeyMenu.propTypes = {
  showMenu: PropTypes.func.isRequired,
  jumpKey: PropTypes.number.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default ChangeKeyMenu;
