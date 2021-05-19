// This is server side
const express = require('express')
const app = express()
const http = require('http')
const httpServer = http.createServer(app)
const path = require('path')
const io = require('socket.io')(httpServer)
const shuffle = require('shuffle-array')
const axios = require('axios')

const port = 3000
const url = 'https://opentdb.com/api.php?amount=3&type=multiple'
const htmlPath = '/public/html/'

let points = {}
let gameQuestions = []
let time = 3 // Global counter start time.
let gameRunning = false

app.use(express.static('public'))

// Global Game timer
const gameInterval = setInterval(() => {
  time--
  if (time === 0) {
    time = 20
    io.emit('updateTimeStart', time)
  }
  io.emit('updateTime', time)
  io.in('Spectator').emit('updateTimeNextRound', time)
}, 1000)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, htmlPath + 'index.html'))
})

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    // Remove from result list.
    if (socket.id in points) {
      delete points[socket.id]
      io.emit('showAmountOfPlayers', -1)
    }
    console.log('A user disconnected: ' + socket.id)
  })

  console.log('A user connected: ' + socket.id)

  let connectedPlayers = io.sockets.adapter.rooms.get('Game')
  if (connectedPlayers) {
    io.emit('showAmountOfPlayers', connectedPlayers.size)
  }

  socket.emit('WaitingRoom', gameRunning)

  socket.on('JoinGameLobby', () => {
    console.log('joined Gamelobby', socket.id)
    socket.join('Game')
    gameRunning = true
  })

  socket.on('StartGame', () => {
    gameRunning = true

    let spectators = io.sockets.adapter.rooms.get('Spectator')
    if (spectators) {
      for (const clientId of spectators) {
        //this is the socket of each client in the room.
        const clientSocket = io.sockets.sockets.get(clientId)

        clientSocket.join('Game')
        clientSocket.leave('Spectator')
      }
    }

    // Get all clients in the "Game" room.
    let clients = io.sockets.adapter.rooms.get('Game')
    // Add clients to resultlist to keep track of points.
    // And give client att visual name instead of socket.id.
    let i = 0
    if (clients) {
      for (const clientId of clients) {
        points[clientId] = { points: 0, name: 'Player-' + i.toString() }
        i++
      }
      io.emit('showAmountOfPlayers', clients.size)
    }

    axios
      .get(url)
      .then(function (response) {
        if (response.status === 200) {
          gameQuestions = response.data.results

          // Get data relevant for the player and shuffle answers. (We want no cheating)
          let playerQuestionsData = manipulateData(gameQuestions, [])

          // emit questions
          io.in('Game').emit('getQuestions', playerQuestionsData)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
  })

  // Waiting lobby if the game is already running when client connects.
  socket.on('SpectatorLobby', () => {
    console.log('joined SpectatorLobby', socket.id)
    socket.join('Spectator')
  })

  socket.on('Validate', (btn_value, question_nr) => {
    let correct = gameQuestions[question_nr].correct_answer.toString()

    // Convert answer to htmlencoded string to be able to compare the value with
    // the correct answer from the API.
    btn_value = btn_value.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
      return '&#' + i.charCodeAt(0) + ';'
    })
    if (btn_value === correct) {
      points[socket.id].points++
    }

    io.to(socket.id).emit('UpdateButtons', correct)
  })

  socket.on('GameOver', () => {
    let clients = io.sockets.adapter.rooms.get('Spectator')
    if (clients) {
      for (const clientId of clients) {
        //this is the socket of each client in the room.
        const clientSocket = io.sockets.sockets.get(clientId)

        clientSocket.join('Game')
        clientSocket.leave('Spectator')
      }
    }

    let connectedPlayers = io.sockets.adapter.rooms.get('Game')
    if (connectedPlayers) {
      io.emit('showAmountOfPlayers', connectedPlayers.size)
    }

    gameQuestions = []
    gameRunning = false
    io.emit('DisplayScore', points)
  })
})

httpServer.listen(port, () => {
  console.log('server is up on port: ' + port)
})

/**
 *  Function that handles the data that will be displayed to the player later. Mixing in correct answer with the wrong ones and shuffles them.
 * @param {array} gameQuestions The response object.
 * @param {array} newData empty array.
 * @returns
 */
function manipulateData(gameQuestions, newData) {
  for (let i = 0; i < gameQuestions.length; i++) {
    const question = gameQuestions[i]
    let answers = []
    answers.push(question.correct_answer)
    question.incorrect_answers.forEach((ans) => {
      answers.push(ans)
    })

    // Shuffle answers.
    answers = shuffle(answers)

    newData[i] = {
      question: question.question,
      answers: answers,
    }
  }
  return newData
}

/**
 *
 * @param {string} html html encoded string
 * @returns decoded html string.
 */
function decodeHTML(html) {
  var txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}
