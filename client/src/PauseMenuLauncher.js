import React, { Component } from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import isNil from 'lodash/fp/isNil';
import styles from './PauseMenuLauncherStyles';
import styled from 'styled-components';

const StyledButton = styled.div`
  display: block;
  padding: 15px 25px;
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  outline: none;
  color: #fff;
  background-color: #4caf50;
  border: none;
  border-radius: 15px;
  box-shadow: 0 9px #999;
  margin: 15px;
`;
class PauseLauncher extends Component {
  constructor(props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
  }
  componentDidMount() {
    document.addEventListener('click', this.handleClose, false);
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.handleClose, false);
  }

  handleClose(e) {
    const { onCloseRequest, classes } = this.props;
    if (!isNil(this.modal)) {
      if (!this.modal.contains(e.target)) {
        onCloseRequest();
        document.removeEventListener('click', this.handleOutsideClick, false);
      }
    }
  }
  render() {
    const { onCloseRequest, classes, restart, changekey } = this.props;
    return (
      <div className={classes.modalOverlay}>
        <div className={classes.modal} ref={node => (this.modal = node)}>
          <div className={classes.modalContent}>
            <StyledButton onClick={onCloseRequest}>Resume</StyledButton>
            <StyledButton onClick={restart}>Restart</StyledButton>
            <StyledButton onClick={changekey}> Changekey</StyledButton>
          </div>
        </div>

        <button
          type="button"
          className={classes.closeButton}
          onClick={onCloseRequest}
        />
      </div>
    );
  }
}
export default injectSheet(styles)(PauseLauncher);
