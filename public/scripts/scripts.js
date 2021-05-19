const socket = io()
// Client side

socket.on('WaitingRoom', (gameRunning) => {
  console.log('Waitingroom')
  if (gameRunning === true) {
    socket.emit('SpectatorLobby')
  } else {
    socket.emit('JoinGameLobby')
  }
})

socket.on('showAmountOfPlayers', (amount) => {
  let sum = amount

  if (amount < 0) {
    sum =
      Number(document.querySelector('#player-status').innerHTML) +
      Number(amount)
  }
  document.querySelector('#player-status').innerHTML = sum
})

socket.on('DisplayScore', (points) => {
  document.getElementById('timer-msg').innerHTML = ''
  document.querySelector('#timer').innerHTML = ''
  document.querySelector('#gameroom').style.display = 'none'

  // Adding points-object to array to be able to sort it.
  var sortable = []
  for (let item in points) {
    sortable.push([item, points[item]['points']])
  }

  // Sort result based on the amount of points.
  sortable.sort(function (a, b) {
    return a[1] - b[1]
  })

  // Create result list.
  let list = '<ol>'
  for (let i = sortable.length - 1; i >= 0; i--) {
    const element = sortable[i]

    if (socket.id === element[0]) {
      list += `
      <li id="player-score">
      You: ${element[1]} Poäng
      </li>`
    } else {
      list += `
      <li>
        ${points[element[0]].name}: ${element[1]} Poäng
      </li>`
    }
  }

  list += '</ol>'
  document.querySelector('#result').innerHTML = list

  socket.on('updateTime', (t) => {
    document.querySelector('#timer').innerHTML = 'Next round begins in: ' + t
  })
})
