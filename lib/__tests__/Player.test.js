const _ = require('lodash')
const { Player } = require('../Player')

describe('constructor', () => {
  test('initialises successfully with log function', () => {
    new Player('id', { logFn: _.identity })
  })

  test('initialises successfully with no options', () => {
    new Player('id')
  })

  test('initialises successfully with empty options', () => {
    new Player('id', {})
  })
})

describe('pieces', () => {
  test('returns sorted list of pieces', () => {
    expect(new Player('id').pieces).toEqual(['A', 'A', 'A', 'B', 'B', 'G', 'G', 'Q', 'S', 'S'])
  })
})

describe('piecesString', () => {
  test('returns sorted list of pieces', () => {
    expect(new Player('id').piecesString).toBe('AAABBGGQSS')
  })
})

describe('removePiece', () => {
  test('correctly removes a piece from non-empty list', () => {
    const player = new Player('id')
    expect(player.piecesString).toBe('AAABBGGQSS')
    player.removePiece('A')
    expect(player.piecesString).toBe('AABBGGQSS')
    player.removePiece('B')
    expect(player.piecesString).toBe('AABGGQSS')
    player.removePiece('A')
    player.removePiece('A')
    player.removePiece('B')
    player.removePiece('G')
    player.removePiece('G')
    player.removePiece('Q')
    player.removePiece('S')
    player.removePiece('S')
    expect(player.piecesString).toBe('')
    player.removePiece('S')
    expect(player.piecesString).toBe('')
  })

  test('doesn\'t remove a piece which isn\'t in a list from non-empty list', () => {
    const player = new Player('id')
    expect(player.piecesString).toBe('AAABBGGQSS')
    player.removePiece('W')
    expect(player.piecesString).toBe('AAABBGGQSS')
  })
})
