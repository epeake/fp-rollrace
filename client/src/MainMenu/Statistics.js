import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Background = styled.div`
  background-color: #323232;
  height: 100vh;
`;

// CSS for title changes whther or not user is on chrome.  Condition checks for chrome
const Title = styled.h1`
  font-family: 'Gugi', cursive;
  font-size: 600%;
  color: white;
`;

const StatText = styled.h3`
  font-family: 'Gugi', cursive;
  margin-top: 2.5%;
  font-size: 200%;
  color: white;
`;

const StyledButton = styled.button`
  background-color: #fffff;
  font-size: 16px;
  border-radius: 12px;
  border: 2px solid #555555;
  font-family: monospace;
  &:hover {
    background-color: #e8e8e8;
  }
`;

export default function Statistics(props) {
  return (
    <Background>
      <Title> Stats </Title>
      <StyledButton onClick={props.goToMenu}>{'<-'} Main Menu </StyledButton>
      <StatText>
        Total Games: {props.user ? props.user.total_games : ''}
      </StatText>
      <StatText>
        Best Map 1 Time: {props.user ? `${props.user.map_1} sec` : ''}
      </StatText>
    </Background>
  );
}

Statistics.propTypes = {
  goToMenu: PropTypes.func.isRequired
};
