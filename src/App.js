// Goals:
// Place a left-to-right scrolling sound item selector at top of view (?).
// Delete for Sound items that are queued at the bottom.
// More sound files (drum kit, piano).
// Need a button on the top directory of sound samples to add them to the queue.
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.
// Scroll queued samples container right most if item is added.

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
    playAudio(this.node.current)
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
    disabled: this.props.numberOfQueuedSounds === 0
  }

  static propTypes = {
    numberOfQueuedSounds: PropTypes.number.isRequired,
    start: PropTypes.func.isRequired
  }

  componentDidMount() {
    this.listener = event => {
      if (event.code === 'Space') {
        this.props.start()
      }
    }

    window.addEventListener('keydown', this.listener)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.listener)
  }

  componentDidUpdate(previousProps) {
    let current = this.props.numberOfQueuedSounds
    let previous = previousProps.numberOfQueuedSounds

    // if either are 0, toggle it
    if (current === 0 || previous === 0) {
      let currentlyDisabled = previous > current

      this.setState({
        disabled: currentlyDisabled
      })
    }
  }

  clicked = () => {
    if (this.state.disabled) {
      return // noop
    }
    this.props.start()
  }

  render() {
    const { disabled } = this.state

    return (
      <div
        className={`play-btn-container ${disabled ? 'disabled' : null}`}
        onClick={this.clicked}
      >
        <button className={disabled ? 'disabled' : null} onClick={this.clicked}>
          {'>'}
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

  addSound = audioNodeRef => {
    this.setState({
      sounds: this.state.sounds.concat(audioNodeRef)
    })
  }

  start = async () => {
    let { sounds } = this.state
    let size = sounds.length

    if (size === 0) {
      alert('Double click sounds from the top to queue them at bottom.')
      return
    }

    for (let index = 0; index < size; index++) {
      if (index !== 0) {
        await delay(200)
      }

      playAudio(sounds[index].node.current)
    }
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
            name="hihat"
            path="./sounds/hihat.wav"
            addSound={this.addSound}
          />
          <Sound
            name="snare"
            path="./sounds/snare.wav"
            addSound={this.addSound}
          />
          <Sound
            name="kick"
            path="./sounds/kick.wav"
            addSound={this.addSound}
          />
        </div>

        <section className="song-container sound-items-container">
          <PlayButton numberOfQueuedSounds={size} start={this.start} />

          <div className="sound-items-container">
            {QueuedSoundViews || 'You need waayy more clout, yo.'}
          </div>
        </section>
      </main>
    )
  }
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function playAudio(audioNode) {
  if (!audioNode) {
    console.error(`Cannot play audioNode: ${audioNode}`)
  }

  // always play sound from beginning.
  // setting `currentTime` also fixes the bug where playing two of the same
  // neighboring sound samples only emits a single sound.
  audioNode.currentTime = 0
  audioNode.play()
}
