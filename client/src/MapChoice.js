import React from 'react';
import PropTypes from 'prop-types';
import {
  CardSubtitle,
  CardText,
  Button,
  Card,
  CardBody,
  CardTitle,
  CardImg,
  CardDeck
} from 'reactstrap';

/* eslint-disable react/no-array-index-key */

function MapChoice(props) {
  const { func } = props;
  const maps = [
    'https://placebeard.it/640/360',
    'https://placebear.com/640/360',
    'https://picsum.photos/640/360'
  ];

  const cards = maps.map((link, i) => {
    return (
      <Card
        key={`Map#${i}`}
        style={{ flex: 1, border: '1px black solid', margin: '30px' }}
      >
        <CardImg
          center="true"
          width={`${500 / maps.length}px`}
          height="100px"
          src={link}
          alt="Card image cap"
        />
        <CardBody>
          <CardTitle>{`Map #${i + 1}`}</CardTitle>
          <CardSubtitle>An awesome map to try!</CardSubtitle>
          <CardText>Most people have an easier time using this map.</CardText>
          <Button
            onClick={() => {
              func();
            }}
          >
            Set Map
          </Button>
        </CardBody>
      </Card>
    );
  });

  return (
    <>
      <div style={{ margin: 'auto 0' }}>Choose A Map</div>
      <CardDeck
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        {cards}
      </CardDeck>
    </>
  );
}

MapChoice.propTypes = {
  func: PropTypes.func.isRequired
};

export default MapChoice;
