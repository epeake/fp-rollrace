import styled from 'styled-components';

export const StyledButton = styled.button`
  display: block;
  padding: 15px;
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  color: white;
  background-color:#33af6d;
  border: none;
  border-radius: 20px;
  box-shadow: 0 9px #999;
  margin: 15px;
  width:90%;
 
 :hover {background-color: #3e8e41}
 :active {
  background-color: #3e8e41;
  box-shadow: 0 5px #666;
  transform: translateY(4px);
`;

export default StyledButton;
