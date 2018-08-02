// Goals:
// More sound files (drum kit, piano).
// Need gridlines (and enhanced gridlines every K'th (where K is input by UI)).
// Need a way to get output from this app and turn it into some thing a DAW can use.
// Scroll queued samples container right most if item is added.
// Fix multi-play bug when loop is on and play button is pressed multiple times.
// onplay => animate css
// Replace forloop with setTimeout for stop feature to work properly?

import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'

// Don't @ me
import './App.css'

const DEV = process.env.NODE_ENV !== 'production'

const auxBtnClass = 'sound-item-aux-btn'

let keyID = 0

class QueuedSound extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    path: PropTypes.string,
    deleteSound: PropTypes.func.isRequired,
  }

  queuedAudioNode = createRef()
  queuedContainerNode = createRef()

  componentDidMount() {
    let queuedContainer = this.queuedContainerNode.current
    let queuedAudio = this.queuedAudioNode.current

    queuedAudio.onplay = () => {
      queuedContainer.classList.add('playing')
    }
    queuedAudio.onended = () => {
      queuedContainer.classList.remove('playing')
    }
  }

  playSound = event => {
    // this function is called EVEN WHEN the user clicks the X,
    // intending to delete the sound, not play it.
    if (!event.target.classList.contains(auxBtnClass)) {
      const { name } = this.props

      log(`Clicked queued sound "${name}".`)
      playAudio(this.queuedAudioNode.current)
    }
  }

  render() {
    const { name, path, deleteSound } = this.props

    return (
      <div
        className="sound-item queued-sound-item"
        onClick={this.playSound}
        ref={this.queuedContainerNode}
      >
        <kbd>{name}</kbd>
        <audio src={path && path} ref={this.queuedAudioNode} />
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
  containerNode = createRef()

  // TODO: onplay => animate css
  componentDidMount() {
    let container = this.containerNode.current
    let audio = this.audioNode.current

    audio.onplay = () => {
      container.classList.add('playing')
    }
    audio.onended = () => {
      container.classList.remove('playing')
    }
  }

  playSound = event => {
    log(`Clicked sound "${this.props.name}".`)
    playAudio(this.audioNode.current)
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
      <div
        className="sound-item"
        onClick={this.enqueue}
        ref={this.containerNode}
      >
        <kbd>{name}</kbd>
        <audio src={path && path} ref={this.audioNode} />
        <div className={auxBtnClass} onClick={this.playSound}>
          {path && '>'}
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

  // TODO:
  // PlayButton shows stop sign only for first playthrough of song while this.state.loop is true.
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
    bpmErrorMessage: null, // Enforces unsigned integer-ness on BPM input.
  }

  stopRequested = false

  addSound = ({ name, path, audioNode }) => {
    log(`Adding sound "${name}" to queue.`)
    this.setState({
      sounds: this.state.sounds.concat({ name, path, audioNode }),
    })
  }

  // The `index` dependency gets injected when mapping state to view.
  createDeleteSound = index => () => {
    const { sounds } = this.state

    log(`Deleting sound "${sounds[index].name}" at index ${index}.`)

    this.setState({
      sounds: sounds.filter((_, i) => i !== index),
    })
  }

  stop = () => {
    log('Stopping song.')
    this.stopRequested = true
  }

  start = async () => {
    log('Starting song.')

    const { sounds, swing, loop, bpm } = this.state
    const size = sounds.length

    if (size === 0) {
      alert('Click sounds from the top to queue them to be played (in order).')
      return
    }

    for (let index = 0; index < size; index++) {
      if (this.stopRequested) {
        sounds[index].audioNode.current.pause()
        this.stopRequested = false
        break
      }

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

      await playAudio(sounds[index].audioNode.current)
    }

    if (loop) {
      await delay(convert(bpm))
      await this.start()
    }
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
          key={keyID++}
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

function log(message) {
  if (DEV) {
    console.log('Log: ' + message)
  }
}

// https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
// https://github.com/google/blockly/issues/299
// http://html5doctor.com/html5-audio-the-state-of-play/
// http://html5doctor.com/native-audio-in-the-browser/
async function playAudio(audioNode) {
  // Always play sound from beginning.
  // Setting `currentTime` fixes the bug where playing two of the same
  // neighboring sound samples only emits a single sound.
  audioNode.currentTime = 0

  let promise = audioNode.play()

  if (promise) {
    try {
      await promise
    } catch (error) {
      console.error(`playAudio() Error: ${error}`)
    }
  } else {
    log('This should not happen.')

    // Audio _should_ be able to be played from start to finish w/o stuttering.
    // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/GlobalEventHandlers.oncanplaythrough
    audioNode.oncanplaythrough = () => {
      log('oncanplaythrough')
      audioNode.play()
    }
  }
}
