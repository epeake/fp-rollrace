import styled from 'styled-components';
import Modal from 'styled-react-modal';

export const ModalStyledButton = styled.button`
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

export const StyledModal = Modal.styled`
  width: 20rem;
  height: auto;
  display: block;
  align-items: center;
  background-color:#2f2f2f;
`;
