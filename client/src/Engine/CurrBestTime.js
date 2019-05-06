import React from 'react';
import PropTypes from 'prop-types';
import { SVGText } from '../Style/EngineStyle.js';

export default function CurrBestTime(props) {
  return (
    <SVGText fill={'white'} x={props.x + 700} y={props.y + 25}>{`Highscore: ${
      props.score === -1 || props.score === Infinity
        ? 'N/A'
        : `${props.score} sec`
    }`}</SVGText>
  );
}

CurrBestTime.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
