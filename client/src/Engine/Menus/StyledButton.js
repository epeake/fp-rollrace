import styled from 'styled-components';

export const StyledButton = styled.button`
  display: block;
  background-color: #008cba;
  font-size: 30px;
  border-radius: 12px;
  border: 2px solid #555555;
  font-family: monospace;
  &:hover {
    background-color: #02a8de;
  }
  width: 90%;
  padding: 15px;
  margin: 15px;
`;

export default StyledButton;
