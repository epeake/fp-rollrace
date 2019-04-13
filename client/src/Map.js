import React from 'react';
import styled from 'styled-components';

const MapPath = styled.path`
  fill: none;
  stroke: #000000;
  stroke-width: 6;
  stroke-linecap: butt;
  stroke-linejoin: miter;
  stroke-opacity: 1;
`;

export default function Map(props) {
  return (
    <g transform={`translate(${props.translation} 0)`}>
      <MapPath
        d={
          'm 0 442\
                  h 159\
                  v -79\
                  h 159\
                  v 79\
                  h 95\
                  v 95\
                  h 143\
                  v -95\
                  h 381\
                  v -95\
                  h 159\
                  v 95\
                  h 238\
                  v -95\
                  h 365\
                  v -95\
                  h 286\
                  v -95\
                  h 143\
                  v 413\
                  h 333\
                  v -95\
                  h 603\
                  v 95\
                  h 238\
                  v -79\
                  h 143\
                  v 175\
                  h 127\
                  v -79\
                  h 143\
                  v -95\
                  h 111\
                  v 16\
                  h 429\
                  v -143\
                  h 111\
                  v 143\
                  h 79 254\
                  v -111\
                  h 127\
                  v 111\
                  h 270\
                  v 143\
                  h 143\
                  v -79\
                  h 79\
                  v -79\
                  h 238\
                  v -127\
                  h 175\
                  v 127\
                  h 143\
                  v -95\
                  h 127\
                  v 238\
                  h 159\
                  v -111\
                  h 270\
                  v -127\
                  h 159\
                  v 175\
                  h 238\
                  v -111\
                  h 190\
                  v 95\
                  h 127\
                  v -127\
                  h 238\
                  h 159\
                  v -127\
                  h 190\
                  v 190\
                  h 206\
                  v -95\
                  h 111\
                  v 79\
                  h 127\
                  v -111\
                  h 111\
                  v 143\
                  h 95\
                  v -127\
                  h 127\
                  v 143\
                  h 127\
                  v -127\
                  h 127\
                  v 175 0 143\
                  h 127\
                  v 0\
                  h 333\
                  v -175\
                  h 127\
                  v 143\
                  h 111\
                  v -222\
                  h 333\
                  v -127\
                  h 222\
                  v 0\
                  h 190'
        }
      />

      <MapPath
        d={
          'm 2340 100\
          h 511\
          v -111\
          h 159\
          v 175\
          h 206\
          v -127\
          h 127\
          v -111\
          h 143\
          v 238\
          h 127\
          v -95\
          h 111\
          v 95\
          h 111\
          v -95\
          h 143\
          v 95\
          h 159\
          v -190\
          h 127\
          v 159\
          h 175\
          v -111\
          h 159\
          v 111\
          h 143\
          v -95\
          h 127\
          v 95\
          h 476'
        }
      />
    </g>
  );
}
