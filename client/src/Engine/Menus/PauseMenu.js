import React from 'react';
import styled from 'styled-components';
import { ModalProvider } from 'styled-react-modal';
import Modal from 'styled-react-modal';

const StyledButton = styled.button`
  display: block;
  padding: 15px;
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  color: white;
  background-color:#33af6d;
  border: none;
  border-radius: 20px;
  box-shadow: 0 9px #999;
  margin: 15px;
  width:90%;
 :hover {background-color: #3e8e41}
 :active {
  background-color: #02a8de;
  box-shadow: 0 5px #666;
  transform: translateY(4px);
`;

const StyledModal = Modal.styled`
  width: 20rem;
  height: 20rem;
  display: block;
  align-items: center;
  justify-content: center;
  background-color:#2e352a;
`;
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

export default PauseMenu;
