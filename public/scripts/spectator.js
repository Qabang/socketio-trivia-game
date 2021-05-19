// Spectator - client side

socket.on('updateTimeNextRound', (data) => {
  document.getElementById('timer-msg').innerHTML = 'Next Round Starts in: '
  document.getElementById('timer').innerHTML = data
})
