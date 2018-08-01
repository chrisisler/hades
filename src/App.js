// Goals:
// More sound files (drum kit, piano).
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.
// Scroll queued samples container right most if item is added.
// Fix multi-play bug when loop is on and play button is pressed multiple times.
// TODO: onplay => animate css

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

import './App.css'

const { _stop, _play } = (function() {
  let current

  const _stop = () => {
    console.log('current is:', current)
    if (current) {
      current.stop()
      // current = undefined
    }
  }

  const _play = audioNode => {
    if (!audioNode) {
      console.error('Cannot play audioNode as it does not exist.')
    }

    current = audioNode

    // Always play sound from beginning.
    // Setting `currentTime` fixes the bug where playing two of the same
    // neighboring sound samples only emits a single sound.
    audioNode.currentTime = 0
    audioNode.play()

    audioNode.onended = () => {
      current = undefined
    }
  }

  return { _play, _stop }
})()

// see App.css
const auxBtnClass = 'sound-item-aux-btn'

let id = 0

class QueuedSound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string,
    deleteSound: PropTypes.func.isRequired,
  }

  audioNode = createRef()

  playSound = event => {
    // this function is called EVEN WHEN the user clicks the X
    // intending to delete the sound, not play it.
    if (!event.target.classList.contains(auxBtnClass)) {
      const { name } = this.props

      log(`Clicked queued sound "${name}".`)
      _play(this.audioNode.current)
    }
  }

  render() {
    const { name, path, deleteSound } = this.props

    return (
      <div className="sound-item queued-sound-item" onClick={this.playSound}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.audioNode} />
        <div className={auxBtnClass} onClick={deleteSound}>
          {'x'}
        </div>
      </div>
    )
  }
}

class Sound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string, // If no audio provided, this is a rest note.
    addSound: PropTypes.func.isRequired,
  }

  audioNode = createRef()

  // TODO: onplay => animate css
  // componentDidMount() {
  // this.props.audioNode.onplay = () => { }
  // }

  playSound = event => {
    log(`Clicked sound "${this.props.name}".`)
    _play(this.audioNode.current)
  }

  enqueue = event => {
    // User intended to click the play button, not to enqueue.
    if (event.target.classList.contains(auxBtnClass)) return

    const { addSound, name, path } = this.props

    addSound({
      name: name,
      path: path && path,
      audioNode: this.audioNode,
    })
  }

  render() {
    const { name, path } = this.props

    return (
      <div className="sound-item" onClick={this.enqueue}>
        <kbd>{name}</kbd>
        <audio src={path} ref={this.audioNode} />
        <div className={auxBtnClass} onClick={this.playSound}>
          {'>'}
        </div>
      </div>
    )
  }
}

class PlayButton extends Component {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    start: PropTypes.func.isRequired,
    stop: PropTypes.func.isRequired,
  }

  state = {
    isPlaying: false,
  }

  componentDidMount() {
    this.listener = event => {
      if (event.code === 'Space') {
        this.props.clicked()
      }
    }

    window.addEventListener('keydown', this.listener)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.listener)
  }

  play = async () => {
    const { disabled, start, stop } = this.props

    if (disabled) return

    if (this.state.isPlaying) {
      this.setState({ isPlaying: false })
      stop()
    } else {
      this.setState({ isPlaying: true })
      await start()
      this.setState({ isPlaying: false })
    }
  }

  render() {
    const { disabled } = this.props

    return (
      <div
        className={`play-btn-container ${disabled ? 'disabled' : null}`}
        onClick={this.play}
      >
        <button className={disabled ? 'disabled' : null} onClick={this.play}>
          {this.state.isPlaying ? 'x' : '>'}
        </button>
      </div>
    )
  }
}

export default class App extends Component {
  state = {
    sounds: [],
    swing: false,
    loop: false,
    bpm: 75,
    bpmErrorMessage: null, // Exists to enforce unsigned integer-ness
  }

  addSound = ({ name, path, audioNode }) => {
    log(`Adding sound "${name}" to queue.`)
    this.setState({
      sounds: this.state.sounds.concat({ name, path, audioNode }),
    })
  }

  // Sorta dependency injecting when mapping props to view.
  createDeleteSound = index => () => {
    log(`Deleting sound "${this.state.sounds[index].name}" at index ${index}.`)
    this.setState({
      sounds: this.state.sounds.filter((_, i) => i !== index),
    })
  }

  stop = () => {
    log('Stopping song.')
    _stop()
  }

  start = async () => {
    log('Starting song.')

    const { sounds, swing, loop, bpm } = this.state
    const size = sounds.length

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
            const swung = converted / 2.5
            await delay(converted - swung)
          }
        }

        await delay(convert(bpm))
      }

      _play(sounds[index].audioNode.current)
    }

    if (loop) {
      await delay(convert(bpm))
      this.start()
    }

    return
  }

  handleBPM = event => {
    if (event.key === 'Enter') {
      if (event.target.value.length === 0) return

      const bpm = +event.target.value

      if (bpm < 40) {
        this.setState({
          bpmErrorMessage: 'BPM cannot go below 40.',
        })
      } else {
        this.setState({
          bpm,
          bpmErrorMessage: null,
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
    const { sounds, bpm, swing, loop, bpmErrorMessage } = this.state
    const size = sounds.length
    const QueuedSoundViews =
      size &&
      sounds.map(({ name, path, audioNode }, index) => (
        <QueuedSound
          key={id++}
          name={name}
          path={path}
          audioNode={audioNode}
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
          {bpmErrorMessage && (
            <div className="bpm-error-message">{bpmErrorMessage}</div>
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
          <PlayButton
            disabled={size === 0}
            start={this.start}
            stop={this.stop}
          />

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

const DEV = process.env.NODE_ENV !== 'production'
function log(message) {
  if (DEV) {
    console.log('Log: ' + message)
  }
}
