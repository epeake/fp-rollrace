import React, { Component } from 'react';
import styled from 'styled-components';
import {
  MenuBackground,
  MenuTitle,
  MainButton,
  MenuText
} from '../Style/MenuStyle.js';

const MapDiv = styled.div`
  text-align: center
  height: 100vh;
`;

// TODO: add map names and get this content from server
const content = [
  {
    title: 'Map 1',
    level: 'Easy',
    image: 'https://placebeard.it/640/360',
    path: [
      'm 0, 650 h 359 v -180 h 159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
    ]
  },
  {
    title: 'Map 2',
    level: 'Medium',
    image: 'https://placebeard.it/640/360',
    path: [
      'm 0, 650 h 359 v -180 h 159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
    ]
  },
  {
    title: 'Map 3',
    level: 'Hard',
    image: 'https://placebeard.it/640/360',
    path: [
      'm 0, 650 h 359 v -180 h 159 v 100 h 95 v 100 h 143 v -100 h 381 v -100 h 159 v 100 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 333 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 397 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 318 h 460 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 412 v -1000 h 500'
    ]
  }
];

class MapChooser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: content,
      currMap: 0
    };
    this.getNewImage = this.getNewImage.bind(this);
    this.handleGoLeft = this.handleGoLeft.bind(this);
    this.handleGoRight = this.handleGoRight.bind(this);
  }

  // TODO: Put on server
  getNewImage() {}

  handleGoLeft() {
    this.setState({ currMap: this.state.currMap - 1 });
  }

  handleGoRight() {
    this.setState({ currMap: this.state.currMap + 1 });
  }

  render() {
    const item = this.state.content[this.state.currMap];

    return (
      <MenuBackground>
        <MapDiv>
          <div>
            <MenuTitle>{item.title}</MenuTitle>
            <MenuText>{item.level}</MenuText>
          </div>
          {this.state.currMap !== 0 && (
            <MainButton className="leftbutton" onClick={this.handleGoLeft}>
              {'<'}
            </MainButton>
          )}
          <img src={item.image} height={'60%'} width={'90%'} alt="" />
          {this.state.currMap !== this.state.content.length - 1 && (
            <MainButton className="rightbutton" onClick={this.handleGoRight}>
              {'>'}
            </MainButton>
          )}
          <div>
            <MainButton className="playbutton" onClick={this.props.handlePlay}>
              {' '}
              Play!
            </MainButton>
          </div>
        </MapDiv>
      </MenuBackground>
    );
  }
}

export default MapChooser;
