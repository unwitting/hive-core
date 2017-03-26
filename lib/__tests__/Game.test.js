const _ = require('lodash')
const { Board } = require('../Board')
const { Game } = require('../Game')
const { Player } = require('../Player')

describe('winner', () => {
  test('correctly identifies no winner', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+0,-1', 3)
    board.applyMove('A+2,-1', 4)
    const game = new Game(new Player('white'), new Player('black'))
    game._board = board
    expect(game.winner).toBe(null)
  })

  test('correctly identifies a winner', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    board.applyMove('S+-1,1', 5)
    board.applyMove('S+3,0', 6)
    board.applyMove('A+-2,1', 7)
    board.applyMove('A+4,0', 8)
    board.applyMove('A+-2,0', 9)
    board.applyMove('A+5,0', 10)
    board.applyMove('A+-1,-1', 11)
    board.applyMove('A+6,0', 12)
    board.applyMove('B+0,-1', 13)
    const game = new Game(new Player('white'), new Player('black'))
    game._board = board
    expect(game.winner).toBe(game.blackPlayer)
  })
})

describe('_validateMove', () => {
  test('disallows a move to place a piece the player doesn\'t have', () => {
    const game = new Game(new Player('white'), new Player('black'))
    game.whitePlayer._pieces = ['Q', 'B']
    expect(() => game._validateMove('A+0,0')).toThrowError('NO_SUCH_PIECE_IN_HAND')
  })
})
