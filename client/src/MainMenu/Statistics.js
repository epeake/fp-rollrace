import React from 'react';
import PropTypes from 'prop-types';

export default function Statistics(props) {
  return (
    <div>
      <img className="statslogo" alt="stats" />
      <div>
        <h3>Total Games: {props.user ? props.user.total_games : ''}</h3>
      </div>
      <div>
        <h3>Best Map 1 time: {props.user ? props.user.map_1 : ''}</h3>
      </div>
      <div>
        <img
          height="50"
          className="2menubutton"
          alt="2menu"
          onClick={props.goToMenu}
        />
      </div>
    </div>
  );
}

Statistics.propTypes = {
  goToMenu: PropTypes.func.isRequired
};
