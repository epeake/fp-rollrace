import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Text = styled.text`
  font-size: 200%;
  font-family: 'Gugi', cursive;
`;

export default function CurrBestTime(props) {
  return (
    <Text fill={'white'} x={props.x + 700} y={props.y + 25}>{`Highscore: ${
      props.score
    } sec`}</Text>
  );
}

CurrBestTime.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
