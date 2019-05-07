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
    image: 'https://placebeard.it/640/360'
  },
  {
    title: 'Map 2',
    level: 'Medium',
    image: 'https://placebeard.it/640/360'
  },
  {
    title: 'Map 3',
    level: 'Hard',
    image: 'https://placebeard.it/640/360'
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
            <MainButton onClick={this.handleGoLeft}>{'<'}</MainButton>
          )}
          <img src={item.image} height={'60%'} width={'90%'} alt="" />
          {this.state.currMap !== this.state.content.length - 1 && (
            <MainButton onClick={this.handleGoRight}>{'>'}</MainButton>
          )}
          <div>
            <MainButton onClick={this.props.handlePlay}> Play!</MainButton>
          </div>
        </MapDiv>
      </MenuBackground>
    );
  }
}

export default MapChooser;
