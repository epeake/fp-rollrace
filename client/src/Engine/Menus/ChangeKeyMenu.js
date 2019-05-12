/*
 * This file contains the ChangeKeyMenu component, which is called from the
 * paused menu. Key is not actually changed in GameEngine until the user exits.
 */

import React, { Component } from 'react';
import styled from 'styled-components';
import { ModalProvider } from 'styled-react-modal';
import PropTypes from 'prop-types';
import { StyledModal, ModalStyledButton } from '../../Style/ModalStyle.js';

const StyledP = styled.p`
  text-align: center;
  color: white;
  font-family: 'Gugi', cursive;
`;

class ChangeKeyMenu extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;

    /*
     * We have to maintain a separate state for jump key here and the GameEngine's
     * jump key becuase here we also display the current selected jump key on
     * top of the previous jump key.  The importance of this is that if the
     * player is to rapidly change key, there are many function calls, which
     * causes uneccesary computation.
     */
    this.state = {
      jumpKey: undefined
    };
    this.handleKeyChange = this.handleKeyChange.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    const docBody = document.querySelector('body');
    docBody.addEventListener('keypress', e => this.handleKeyChange(e));
  }

  // now we reset the jump key in GameEngine upon leaving
  handleExit() {
    const newKey = this.state.jumpKey;
    this.props.goBack(newKey);
  }

  handleKeyChange(event) {
    if (this._isMounted) {
      this.setState({ jumpKey: event.keyCode });
    }
  }

  componentWillUnmount() {
    const docBody = document.querySelector('body');
    docBody.removeEventListener('keypress', e => this.handleKeyChange(e));
    this._isMounted = false;
  }

  render() {
    const { showModal, currentKey } = this.props;
    const { jumpKey } = this.state;
    return (
      <ModalProvider>
        <StyledModal isOpen={showModal}>
          <StyledP>Press New jumpKey</StyledP>
          <StyledP>
            {`Current Key: ${
              currentKey === 32
                ? 'SPACE'
                : String.fromCharCode(currentKey).toUpperCase()
            }`}
          </StyledP>
          {jumpKey && (
            <StyledP>
              {`Selected Key: ${
                jumpKey === 32
                  ? 'SPACE'
                  : String.fromCharCode(jumpKey).toUpperCase()
              }`}
            </StyledP>
          )}
          <ModalStyledButton className="back" onClick={this.handleExit}>
            Back
          </ModalStyledButton>
        </StyledModal>
      </ModalProvider>
    );
  }
}

ChangeKeyMenu.propTypes = {
  goBack: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default ChangeKeyMenu;
