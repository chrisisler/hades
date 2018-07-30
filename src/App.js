// Goals:
// More sound files (drum kit, piano).
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.
// Scroll queued samples container right most if item is added.
// ADD LOOP FEATURE
// TODO: onplay => animate css

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

import './App.css'

// @see App.css
const auxBtnClass = 'sound-item-aux-btn'

let id = 0

class QueuedSound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string,
    deleteSound: PropTypes.func.isRequired
  }

  node = createRef()

  clicked = event => {
    // this function is called EVEN WHEN the user clicks the X
    // intending to delete the sound, not play it.
    if (!event.target.classList.contains(auxBtnClass)) {
      log(`Clicked queued sound "${this.props.name}".`)
      playAudio(this.node.current)
    }
  }

  render() {
    const { name, path, deleteSound } = this.props

    return (
      <div className="sound-item queued-sound-item" onClick={this.clicked}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
        <div className={auxBtnClass} onClick={deleteSound}>
          x
        </div>
      </div>
    )
  }
}

class Sound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string, // If no audio provided, this is a rest note.
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
    if (!event.target.classList.contains(auxBtnClass)) {
      log(`Clicked sound "${this.props.name}".`)
      playAudio(this.node.current)
    }
  }

  enqueue = event => {
    const { addSound, name, path } = this.props

    addSound({
      name: name,
      path: path && path,
      node: this.node
    })
  }

  render() {
    const { name, path } = this.props

    return (
      <div className="sound-item" onClick={this.clicked}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.node} />
        <div className={auxBtnClass} onClick={this.enqueue}>
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
    if (disabled) return
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
    queued: [],
    swing: false,
    loop: false,
    bpm: 120,
    bpmErrorMessage: null // Exists to enforce unsigned integer-ness
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

    const { queued, swing, loop, bpm } = this.state
    const size = queued.length

    if (size === 0) {
      alert('Double click sounds from the top to queue them at bottom.')
      return
    }

    for (let index = 0; index < size; index++) {
      // Do not delay after pressing start button.
      if (index !== 0) {
        if (swing) {
          if (index % 2 === 0) {
            const converted = convert(bpm)
            const swung = converted / 3
            await delay(converted - swung)
          } else {
            await delay(convert(bpm))
          }
        } else {
          await delay(convert(bpm))
        }
      }

      playAudio(queued[index].node.current)
    }

    if (loop) {
      await delay(convert(bpm))
      this.start()
    }
  }

  handleBPM = event => {
    if (event.key === 'Enter') {
      if (event.target.value.length === 0) return

      const bpm = +event.target.value

      if (bpm < 40) {
        this.setState({
          bpmErrorMessage: 'BPM cannot go below 40.'
        })
      } else {
        this.setState({
          bpm,
          bpmErrorMessage: null
        })
      }
    }
  }

  toggleLoop = () => {
    this.setState({ loop: !this.state.loop })
  }

  toggleSwing = () => {
    this.setState({ swing: !this.state.swing })
  }

  render() {
    const { queued, bpm, swing, loop } = this.state
    const size = queued.length
    const QueuedSoundViews =
      size &&
      queued.map((sound, index) => (
        <QueuedSound
          key={id++}
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
          <Sound name="rest" addSound={this.addSound} />
        </div>

        <div className="options-container">
          {this.state.bpmErrorMessage && (
            <div className="bpm-error-message">
              {this.state.bpmErrorMessage}
            </div>
          )}

          <span>BPM:</span>
          <input
            type="number"
            placeholder={bpm}
            className="bpm-input"
            onKeyPress={this.handleBPM}
            onBlur={this.handleBPM}
          />

          <br />

          <span>Loop:</span>
          <button onClick={this.toggleLoop} className="options-btn">
            {loop ? 'On' : 'Off'}
          </button>

          <br />

          <span>Swing:</span>
          <button onClick={this.toggleSwing} className="options-btn">
            {swing ? 'On' : 'Off'}
          </button>
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

// Convert milliseconds to beats per minute at 16th notes.
function convert(ms) {
  // TODO: replace `4` with `N` where N is the beat division which may be
  // pentuplets or triplets or seventuplets or w/e given by user/UI.
  return 60000 / (ms * 4)
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function playAudio(audioNode) {
  if (!audioNode) {
    console.error(`Cannot play audioNode: ${audioNode.src}`)
  }

  // Always play sound from beginning.
  // Setting `currentTime` fixes the bug where playing two of the same
  // neighboring sound samples only emits a single sound.
  audioNode.currentTime = 0
  audioNode.play()
}

const DEV = process.env.NODE_ENV !== 'production'
function log(message) {
  if (DEV) {
    console.log('Log: ' + message)
  }
}
