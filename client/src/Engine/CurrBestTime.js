import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import request from 'request-promise-native';

const Text = styled.text`
  margin-top: 10px
  font-size: 30px;
`;

class CurrBestTime extends Component {
  constructor(props) {
    super(props);

    this.state = {
      score: null
    };
  }

  componentDidMount() {
    if (!this.props.guest) {
      const options = {
        url: `${
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://rollrace.herokuapp.com'
        }/api/users/stats`,
        json: true
      };
      request
        .get(options)
        .then(resp => {
          this.setState({ score: resp.map_1 });
        })
        .catch(err => {
          //console.log('run');
          throw Error(err);
        });
    } else {
      this.setState({ score: this.props.guest.map_1 });
    }
  }

  // TODO: THIS LOOKS UGLY SO WE NEED TO RETHINK WITH ASPECT RATIO
  render() {
    return (
      <Text x={this.props.x + 700} y={this.props.y + 25}>{`Current Best: ${
        this.state.score
      } sec`}</Text>
    );
  }
}

CurrBestTime.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  guest: PropTypes.object
};

export default CurrBestTime;
