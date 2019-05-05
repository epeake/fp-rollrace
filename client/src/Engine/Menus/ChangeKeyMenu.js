import React, { Component } from 'react';
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
  background-color: #3e8e41;
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
  componentWillReceiveProps(nextProps) {
    this.setState({ currentKey: nextProps.jumpKey });
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
