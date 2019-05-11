/* eslint-disable react/no-array-index-key */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import request from 'request-promise-native';
import {
  MenuBackground,
  MenuTitle,
  MenuButton,
  MenuText
} from '../Style/MenuStyle.js';

class Statistics extends Component {
  constructor(props) {
    super(props);
    this.state = { isMounted: false };
    this.allMaps = null;
  }

  componentDidMount() {
    const options = {
      url: `${
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : 'https://rollrace.herokuapp.com'
      }/api/maps/`,
      json: true
    };
    request
      .get(options)
      .then(resp => {
        this.allMaps = resp;
        this.setState({ isMounted: true });
      })
      .catch(err => {
        throw Error(err);
      });
  }

  render() {
    let allMapsText;
    if (this.allMaps) {
      allMapsText = this.allMaps.map((currMap, i) => {
        const mapIndex = `map_${currMap.mapId}`;
        return (
          <MenuText className={'besttime'} key={`${i}mapstatstext`}>
            {`Best ${currMap.title}: `}
            {this.props.user[mapIndex] === -1
              ? 'N/A'
              : `${this.props.user[mapIndex]} sec`}
          </MenuText>
        );
      });
    }

    return (
      <MenuBackground>
        <MenuTitle> Stats </MenuTitle>
        <MenuButton className={'tomenu'} onClick={this.props.goToMenu}>
          {'<-'} Main Menu{' '}
        </MenuButton>
        {this.state.isMounted && (
          <>
            <MenuText className={'totalgames'}>
              Total Games: {this.props.user.total_games}
            </MenuText>
            {allMapsText}
          </>
        )}
      </MenuBackground>
    );
  }
}

Statistics.propTypes = {
  goToMenu: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

export default Statistics;
