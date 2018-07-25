// Goals:
// More sound files (drum kit, piano).
// Need a button on the top directory of sound samples to add them to the queue.
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.
// Scroll queued samples container right most if item is added.
// TODO: onplay => animate css

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

import './App.css'

const auxiliaryButtonClass = 'sound-item-aux'

class QueuedSound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    deleteSound: PropTypes.func.isRequired
  }

  node = createRef()

  clicked = event => {
    // this function is called even when the user clicks the X
    // intending to delete the sound, not play it.
    if (!event.target.classList.contains(auxiliaryButtonClass)) {
      log(`Clicked queued sound "${this.props.name}".`)
      playAudio(this.node.current)
    }
  }

  render() {
    const { name, path, deleteSound } = this.props

    return (
      <div className="sound-item" onClick={this.clicked}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
        <div className={auxiliaryButtonClass} onClick={deleteSound}>
          x
        </div>
      </div>
    )
  }
}

class Sound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    addSound: PropTypes.func.isRequired
  }

  node = createRef()

  // TODO: onplay => animate css
  // componentDidMount() {
  //   this.node.current.onplay = () => {
  //   }
  // }

  clicked = event => {
    // If user did NOT click the auxiliary button, then:
    if (!event.target.classList.contains(auxiliaryButtonClass)) {
      log(`Clicked sound "${this.props.name}".`)
      playAudio(this.node.current)
    }
  }

  enqueue = event => {
    log(`Enqueueing sound "${this.props.name}".`)
    this.props.addSound({
      name: this.props.name,
      path: this.props.path,
      node: this.node
    })
  }

  render() {
    const { name, path } = this.props

    return (
      <div className="sound-item" onClick={this.clicked}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
        <div className={auxiliaryButtonClass} onClick={this.enqueue}>
          +
        </div>
      </div>
    )
  }
}

class PlayButton extends Component {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    start: PropTypes.func.isRequired
  }

  componentDidMount() {
    this.listener = event => {
      if (event.code === 'Space') this.props.start()
    }

    window.addEventListener('keydown', this.listener)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.listener)
  }

  clicked = () => {
    const { disabled, start } = this.props
    if (disabled) {
      return // noop
    }
    start()
  }

  render() {
    const { disabled } = this.props

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
    queued: []
  }

  addSound = ({ name, path, node }) => {
    log(`Adding sound "${name}" to queue.`)
    this.setState({
      queued: this.state.queued.concat({ name, path, node })
    })
  }

  // Sorta dependency injecting when mapping props to view.
  createDeleteSound = index => () => {
    log(`Deleting sound "${this.state.queued[index].name}" at index ${index}.`)
    this.setState({
      queued: this.state.queued.filter((_, i) => i !== index)
    })
  }

  start = async () => {
    log('Starting song.')

    let { queued } = this.state
    let size = queued.length

    if (size === 0) {
      alert('Double click sounds from the top to queue them at bottom.')
      return
    }

    for (let index = 0; index < size; index++) {
      if (index !== 0) {
        await delay(200)
      }

      playAudio(queued[index].node.current)
    }
  }

  render() {
    let size = this.state.queued.length
    let QueuedSoundViews =
      size &&
      this.state.queued.map((sound, index) => (
        <QueuedSound
          key={sound.path + index}
          name={sound.name}
          path={sound.path}
          deleteSound={this.createDeleteSound(index)}
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
          <PlayButton disabled={size === 0} start={this.start} />

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

  // log(`Playing audio ${audioNode}`)

  // always play sound from beginning.
  // setting `currentTime` also fixes the bug where playing two of the same
  // neighboring sound samples only emits a single sound.
  audioNode.currentTime = 0
  audioNode.play()
}

const DEV = process.env.NODE_ENV !== 'production'
function log(message) {
  if (DEV) {
    if (console) {
      console.log('Log: ' + message)
    }
  }
}
