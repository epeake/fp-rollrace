import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

//specifies the x coordinate of the rectangle and starting point
const X_POS = 900;

const SpriteOne = styled.ellipse`
  fill: #ff0000;
`;

const SpriteTwo = styled.ellipse`
  fill: #00ff00;
`;

const Bar = styled.rect`
  fill: #280b0b;
`;

class ProgressBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      player_1_pos: X_POS,
      player_2_pos: X_POS
    };
  }

  //This is just a placeholder for the purpose of demonstartion
  //the two ellipses go beyond the viewbox but this won't be an issue once
  //we incoroporate it to the game.
  componentDidMount() {
    setInterval(() => {
      const player1Pos = this.state.player_1_pos;
      const player2Pos = this.state.player_2_pos;
      this.setState({
        player_1_pos: player1Pos + 5,
        player_2_pos: player2Pos + 10
      });
    }, 1000);
  }

  render() {
    return (
      <g>
        <Bar width={200} height={20} x={X_POS} y={this.props.y} />

        <SpriteOne
          cx={this.state.player_1_pos} /*update player one position*/
          cy={this.props.y + 10} /* offset */
          rx={2.0}
          ry={9.0}
        />

        <SpriteTwo
          cx={this.state.player_2_pos} /*update player two position*/
          cy={this.props.y + 10}
          rx={2.0}
          ry={9.0}
        />
      </g>
    );
  }
}

ProgressBar.propTypes = {
  y: PropTypes.int.isRequired
};

export default ProgressBar;
