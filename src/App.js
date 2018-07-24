// Goals:
// Place a left-to-right scrolling sound item selector at top of view.
// Place a play button in the middle.

import React, { Component } from 'react'

import './App.css'

const SoundItemMock = () => (
  <div dataSound="74" class="sound-item">
    <kbd>sound-item-name</kbd>
    <audio dataSound="74" src="./sounds/kick.wav" />
  </div>
)

export default class App extends Component {
  playSound = event => {
    console.log('event is:', event)
    // let e = document.querySelector(`audio[dataSound="${event.keyCode}"]`)
  }

  render() {
    return (
      <main>
        <div class="sound-items-container">
          <SoundItemMock />
          <SoundItemMock />
        </div>
      </main>
    )
  }
}
