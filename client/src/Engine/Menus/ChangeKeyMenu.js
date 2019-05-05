import React, { Component } from 'react';
import styled from 'styled-components';
import { ModalProvider } from 'styled-react-modal';
import StyledModal from './StyledModal.js';
import StyledButton from './StyledButton.js';

const StyledP = styled.p`
  display: block;
  text-align: center;
  color: white;
`;

class ChangeKeyMenu extends Component {
  constructor(props) {
    super(props);
    this.state = { currentKey: this.props.jumpKey };
  }

  // Give an update if the props change so that the user can see
  // which key they chose before going back to pause menu.

  static getDerivedStateFromProps(props, state) {
    if (props.jumpKey !== state.currentKey) {
      return {
        currentKey: props.jumpKey
      };
    }
    return null;
  }

  render() {
    const { showMenu, jumpKey, showModal } = this.props;
    return (
      <ModalProvider>
        <StyledModal isOpen={showModal}>
          <StyledP>Press New jumpKey</StyledP>
          <StyledP>
            {`Current Key: ${
              jumpKey === 32
                ? 'SPACE'
                : String.fromCharCode(this.state.currentKey).toUpperCase()
            }`}
          </StyledP>
          <StyledButton onClick={showMenu}>Previous Menu</StyledButton>
        </StyledModal>
      </ModalProvider>
    );
  }
}
export default ChangeKeyMenu;
