// Goals:
// Place a left-to-right scrolling sound item selector at top of view (?).
// Delete for Sound items that are queued at the bottom.
// More sound files (drum kit, piano).
// Need a button on the top directory of sound samples to add them to the queue.
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

import './App.css'

class Sound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    addSound: PropTypes.func.isRequired
  }

  node = createRef()

  clicked = event => {
    // always play sound from beginning
    this.node.current.currentTime = 0
    this.node.current.play()
  }

  doubleClicked = event => {
    this.props.addSound({
      name: this.props.name,
      path: this.props.path,
      node: this.node
    })
  }

  render() {
    const { name, path } = this.props

    return (
      <div
        className="sound-item"
        onClick={this.clicked}
        onDoubleClick={this.doubleClicked}
      >
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
      </div>
    )
  }
}

class PlayButton extends Component {
  state = {
    isPlaying: false,
    disabled: this.props.numberOfQueuedSounds === 0
  }

  static propTypes = {
    numberOfQueuedSounds: PropTypes.number.isRequired,
    playTrack: PropTypes.func.isRequired
  }

  componentDidUpdate(previousProps) {
    let current = this.props.numberOfQueuedSounds
    let previous = previousProps.numberOfQueuedSounds

    // if either are 0, toggle it
    if (current === 0 || previous === 0) {
      this.setState({
        isPlaying: !this.state.isPlaying
      })
    }
  }

  clicked = () => {
    const { isPlaying, disabled } = this.state

    if (disabled) {
      return // noop
    }

    this.setState({
      isPlaying: !isPlaying
    })
  }

  render() {
    return (
      <div className="play-btn-container">
        <button onClick={this.clicked}>
          {this.state.isPlaying ? '>' : '||'}
        </button>
      </div>
    )
  }
}

export default class App extends Component {
  state = {
    // TODO use the Queue<T> class
    sounds: []
  }

  addSound = node => {
    this.setState({
      sounds: this.state.sounds.concat(node)
    })
  }

  playTrack = () => {
    if (this.state.sounds.length === 0) {
      alert('Double click sounds from the top to queue them at bottom.')
      return
    }

    this.state.sounds.forEach(async sound => {
      sound.node.current.play()
      console.log('delaying')
      await delay(200)
    })
  }

  render() {
    let size = this.state.sounds.length
    let QueuedSoundViews =
      size &&
      this.state.sounds.map((sound, index) => (
        <Sound
          key={sound.path + index}
          name={sound.name}
          path={sound.path}
          addSound={this.addSound}
        />
      ))

    return (
      <main>
        <div className="sound-items-container">
          <Sound
            name="kick"
            path="./sounds/kick.wav"
            addSound={this.addSound}
          />
        </div>

        <section className="song-container sound-items-container">
          <PlayButton numberOfQueuedSounds={size} playTrack={this.playTrack} />
          {QueuedSoundViews || 'You need waayy more clout, yo.'}
        </section>
      </main>
    )
  }
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
