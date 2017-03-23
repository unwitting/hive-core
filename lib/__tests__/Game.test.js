const _ = require('lodash')
const { Game } = require('../Game')
const { Player } = require('../Player')

describe('_validateMove', () => {
  test('disallows a move to place a piece the player doesn\'t have', () => {
    const game = new Game(new Player('white'), new Player('black'))
    game.whitePlayer._pieces = ['Q', 'B']
    expect(() => game._validateMove('A+0,0')).toThrowError('NO_SUCH_PIECE_IN_HAND')
  })
})
