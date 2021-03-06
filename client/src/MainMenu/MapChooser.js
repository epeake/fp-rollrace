/*
 * Displayes the possible maps to play from in singleplayer mode.  Includes title,
 * difficulty, and a picture.  When the user clicks the play button, they update
 * the state of the map in the App.js file, which is then passed to the GameEngine
 * so the path is rendered properly and the stats are set for the correct map.
 *  Map update happens with the prop handleChooseMap.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import request from 'request-promise-native';
import {
  MenuBackground,
  MenuTitle,
  MenuButton,
  MainButton,
  ClearMainButton,
  MenuText
} from '../Style/MenuStyle.js';

const MapDiv = styled.div`
  text-align: center;
`;

class MapChooser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: undefined,
      currMap: 0
    };

    this.handleGoLeft = this.handleGoLeft.bind(this);
    this.handleGoRight = this.handleGoRight.bind(this);
  }

  handleGoLeft() {
    this.setState({ currMap: this.state.currMap - 1 });
  }

  handleGoRight() {
    this.setState({ currMap: this.state.currMap + 1 });
  }

  // load all of the maps contained from within the server's maps.json file
  componentDidMount() {
    const options = {
      url: `${
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : 'https://rollrace.herokuapp.com'
      }/api/maps`,
      json: true
    };
    request
      .get(options)
      .then(resp => {
        this.setState({ content: resp });
      })
      .catch(err => {
        throw Error(err);
      });
  }

  render() {
    let item;
    if (this.state.content) {
      item = this.state.content[this.state.currMap];
    }

    return (
      <MenuBackground>
        <MenuButton className="menubutton" onClick={this.props.goToMenu}>
          {'<-'} Main Menu
        </MenuButton>
        {this.state.content && (
          <MapDiv>
            <div>
              <MenuTitle>{item.title}</MenuTitle>
              <MenuText>{item.level}</MenuText>
            </div>
            {this.state.currMap !== 0 ? (
              <MainButton className="leftbutton" onClick={this.handleGoLeft}>
                {'<'}
              </MainButton>
            ) : (
              <ClearMainButton className="leftbutton">{'<'}</ClearMainButton>
            )}

            <img src={item.image} height={'50%'} width={'50%'} alt="" />
            {this.state.currMap !== this.state.content.length - 1 ? (
              <MainButton className="rightbutton" onClick={this.handleGoRight}>
                {'>'}
              </MainButton>
            ) : (
              <ClearMainButton className="rightbutton">{'>'}</ClearMainButton>
            )}
            <div>
              <MainButton
                className="playbutton"
                onClick={() =>
                  this.props.handleChooseMap(undefined, this.state.currMap)
                }
              >
                {' '}
                Play!
              </MainButton>
            </div>
          </MapDiv>
        )}
      </MenuBackground>
    );
  }
}

MapChooser.propTypes = {
  handleChooseMap: PropTypes.func
};

export default MapChooser;
