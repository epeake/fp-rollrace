import React, { Component } from 'react';
import PropTypes from 'prop-types';
import statistics from './buttonSVGs/statistics.svg';
import return2menu from './buttonSVGs/return2menu.svg';
class Statistics extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.props.goToMenu();
  }
  render() {
    return (
      <div>
        <img src={statistics} className="statslogo" alt="stats" />
        <div>
          <img
            src={return2menu}
            height="50"
            className="2menubutton"
            alt="2menu"
            onClick={this.handleClick}
          />
        </div>
      </div>
    );
  }
}

Statistics.propTypes = {
  goToMenu: PropTypes.func.isRequired
};

export default Statistics;
