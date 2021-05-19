//player - client side.

// Add click event to buttons
let buttons = document.querySelectorAll('.answer-btn')
if (buttons) {
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i]
    button.addEventListener('click', function (e) {
      let question_nr = button.getAttribute('question')

      socket.emit('Validate', this.innerHTML, question_nr)
      for (let a = 0; a < buttons.length; a++) {
        buttons[a].disabled = true
      }
    })
  }
}

socket.on('updateTimeStart', (t) => {
  socket.off('updateTimeNextRound')
  document.getElementById('timer-msg').innerHTML = ''

  let stopper = 3
  socket.on('updateTime', (b) => {
    document.querySelector('#timer').innerHTML = 'Game Starts In: ' + stopper
    if (stopper === 0) {
      socket.off('updateTime')
      socket.emit('StartGame')

      document.querySelector('#result').innerHTML = ''
      stopper = 3
    }
    stopper--
  })
})

socket.on('UpdateButtons', (correct_answer) => {
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    if (btn.innerHTML === correct_answer) {
      btn.classList.add('btn-success')
    } else {
      btn.classList.add('btn-danger')
    }
  })
})

socket.on('getQuestions', (questions) => {
  document.getElementById('timer-msg').innerHTML = ''
  let s = 0
  let questionNr = 0

  let questionContainer = document.querySelector('#question')
  let answerButtons = document.querySelectorAll('.answer-btn')

  socket.on('updateTime', (t) => {
    if (questionNr <= 3) {
      document.getElementById('timer').innerHTML = s
    }

    if (s === 0 && questionNr < 3) {
      // Display question and anwsers.
      displayQuestions(questionContainer, answerButtons, questions, questionNr)
      document.querySelector('#gameroom').style.display = 'block'
      s = 5
      questionNr++
    } else if (questionNr === 3 && s === 1) {
      socket.emit('GameOver')
      document.querySelector('#gameroom').style.display = 'none'
      socket.off('updateTime')
    }
    s--
  })
})

/**
 *  Function that displays game data to the player.
 * @param {object} questionContainer HTML element where we display the question for the player/spectator.
 * @param {object} answerButtons object with Array of HTML buttons where the answeralternatives are displayed for the player.
 * @param {object} questions object containing the questions and answers for the game.
 * @param {number} questionNr  Int to keep track of the question to get.
 */
function displayQuestions(
  questionContainer,
  answerButtons,
  questions,
  questionNr
) {
  // Clear data from buttons
  answerButtons.forEach((btn) => {
    btn.classList.remove('btn-success')
    btn.classList.remove('btn-danger')
    btn.disabled = false
  })

  // Display question.
  questionContainer.innerHTML = questions[questionNr].question

  // Display answers
  for (let i = 0; i < answerButtons.length; i++) {
    const btn = answerButtons[i]
    btn.innerHTML = questions[questionNr].answers[i]
    btn.setAttribute('question', questionNr)
  }

  // Display question number.
  document.querySelector('#amount').innerHTML =
    questionNr + 1 + ' out of ' + questions.length
}
