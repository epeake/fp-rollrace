import React, { Component } from 'react';

//specifies the x coordinate of the rectangle and starting point
const LEFT_POS = 50;

class ProgressBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      player_1_pos: LEFT_POS,
      player_2_pos: LEFT_POS
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
      <svg>
        <rect
          style={{ fill: '#280b0b' }}
          width="200"
          height="20"
          x={LEFT_POS}
          y="90"
        />

        <ellipse
          style={{ fill: '#ff0000' }}
          cx={this.state.player_1_pos} //update player one position
          cy="100"
          rx="2.0"
          ry="9.0"
        />

        <ellipse
          style={{ fill: '#00ff00' }}
          cx={this.state.player_2_pos} //update player two position
          cy="100"
          rx="2.0"
          ry="9.0"
        />
      </svg>
    );
  }
}
export default ProgressBar;
