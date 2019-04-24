import React, { Component } from 'react';
import request from 'request-promise-native';

const emptyFields = {
  username: '',
  password: ''
};

class LoginWindow extends Component {
  constructor(props) {
    super(props);
    this.state = emptyFields;

    this.handleUsername = this.handleTextUpdate.bind(this, 'username');
    this.handlePassword = this.handleTextUpdate.bind(this, 'password');
    this.hasWhitespace = this.hasWhitespace.bind(this);
    this.playGuest = this.playGuest.bind(this);
    this.createUser = this.createUser.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  handleTextUpdate(field, event) {
    this.setState({ [field]: event.target.value });
  }

  // returns boolean indicating wheather username or password contain whitespace
  hasWhitespace() {
    const whitespace = /\s/;
    return (
      whitespace.test(this.state.username) ||
      whitespace.test(this.state.password)
    );
  }

  playGuest() {
    const guestAccount = {
      username: 'guest',
      password: '',
      total_games: 0,
      total_multi_games: 0,
      total_multi_wins: 0,
      map_1_time: -1
    };
    this.props.hendleLogin(guestAccount);
  }

  createUser() {
    if (
      !this.hasWhitespace() &&
      this.state.username !== '' &&
      this.state.password !== '' &&
      this.state.username !== 'guest' // exclusive to guest account
    ) {
      const options = {
        url:
          (process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'http://rollrace.herokuapp.com') + `/api/users/`,
        body: {
          username: this.state.username,
          password: this.state.password,
          total_games: 0,
          total_multi_games: 0,
          total_multi_wins: 0,
          map_1_time: -1
        },
        json: true
      };

      request
        .post(options)
        .then(() => {
          alert('User created. Please login');
        })
        .then(() => this.setState(emptyFields))
        .catch(err => {
          console.log(err);
          alert('Try different username and password');
        });
    } else if (this.state.username === '' || this.state.password === '') {
      alert('Please fill all fields');
    } else if (this.hasWhitespace()) {
      console.log(this.hasWhitespace, this.state);
      alert('Username and Password cannot contain whitespace');
    }
  }

  // username and password both strings
  getUser() {
    if (
      !this.hasWhitespace() &&
      this.state.username !== '' &&
      this.state.password !== ''
    ) {
      const options = {
        url:
          (process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'http://rollrace.herokuapp.com') +
          `/api/users/:${this.state.username}`,
        json: true
      };

      request
        .get(options)
        .then(resp => {
          if (resp.length === 0) {
            alert('Could not find user');
          } else {
            const match = resp[0]; // because usernames unique
            if (match.password !== this.state.password) {
              alert('Incorrect username/password combination');
            } else {
              this.props.hendleLogin(match);
            }
          }
        })
        .catch(err => {
          console.log(err);
          alert(err);
        });
    } else if (this.state.username === '' || this.state.password === '') {
      alert('Please fill all fields');
    } else if (this.hasWhitespace()) {
      alert('Incorrect username/password combination');
    }
  }

  render() {
    const { username, password } = this.state;
    return (
      <div>
        <h1>Login</h1>
        Username:
        <input
          type="text"
          name="username"
          value={username}
          placeholder="Username"
          onChange={this.handleUsername}
        />
        <br />
        <br />
        Password:
        <input
          type="text"
          name="password"
          value={password}
          placeholder="Password"
          onChange={this.handlePassword}
        />
        <br />
        <br />
        <button type="button" onClick={this.getUser}>
          Login
        </button>
        <button type="button" onClick={this.createUser}>
          Create User
        </button>
        <button type="button" onClick={this.playGuest}>
          Play As Guest
        </button>
      </div>
    );
  }
}
export default LoginWindow;
