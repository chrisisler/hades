// Goals:
// Place a left-to-right scrolling sound item selector at top of view.
// Place a play button in the middle.

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

import './App.css'

class Sound extends Component {
  static propTypes = {
    node: PropTypes.node,
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  }

  node = createRef()

  clicked = event => {
    // always play sound from beginning
    this.node.current.currentTime = 0
    this.node.current.play()
  }

  render() {
    const { name, path } = this.props

    return (
      <div className="sound-item" onClick={this.clicked}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
      </div>
    )
  }
}

export default class App extends Component {
  state = {
    soundItems: []
  }

  render() {
    return (
      <main>
        <div className="sound-items-container">
          <Sound name="kick" path="./sounds/kick.wav" />
          <Sound name="snare" path="./sounds/snare.wav" />
        </div>

        <section className="song-container">
          Double click a sound from above, homie.
        </section>
      </main>
    )
  }
}
