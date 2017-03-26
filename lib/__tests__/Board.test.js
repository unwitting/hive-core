const _ = require('lodash')
const { Board } = require('../Board')
const { Move } = require('../Move')

describe('constructor', () => {
  test('initialises successfully with log function', () => {
    new Board({ logFn: _.identity })
  })

  test('initialises successfully with no options', () => {
    new Board()
  })

  test('initialises successfully with empty options', () => {
    new Board({})
  })
})

describe('applyMove', () => {
  test('applies valid first move', () => {
    const board = new Board()
    board.applyMove(new Move('S+0,0'), 1)
    expect(board._getCell([0,0])).toEqual([ { piece: 'S', white: true } ])
  })

  test('applies valid first move as string', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    expect(board._getCell([0,0])).toEqual([ { piece: 'S', white: true } ])
  })

  test('applies a movement move successfully', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+0,-1', 3)
    board.applyMove('A+2,-1', 4)
    board.applyMove('B+-1,0', 5)
    board.applyMove('Q+1,1', 6)
    board.applyMove('B>0,0,1', 7)
    expect(board._getCell([-1, 0])).toEqual([])
    expect(board._getCell([0, 0])).toEqual([ { piece: 'S', white: true }, { piece: 'B', white: true } ])
    board.applyMove('A>-1,-1', 8)
    expect(board._getCell([2, -1])).toEqual([])
    expect(board._getCell([-1, -1])).toEqual([ { piece: 'A', white: false } ])
  })

  test('fails if turn not given', () => {
    const board = new Board()
    expect(() => board.applyMove('S+0,0')).toThrow()
  })

  test('disallows a queen on first move for white', () => {
    const board = new Board()
    expect(() => board.applyMove('Q+0,0', 1)).toThrowError('NO_QUEEN_FIRST')
  })

  test('disallows a queen on first move for black', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    expect(() => board.applyMove('Q+1,0', 2)).toThrowError('NO_QUEEN_FIRST')
  })

  test('disallows a first move not at 0,0', () => {
    const board = new Board()
    expect(() => board.applyMove('S+1,0', 1)).toThrowError('FIRST_MOVE_ORIGIN_REQUIRED')
  })

  test('disallows a second move not at 1,0', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    expect(() => board.applyMove('S+0,1', 2)).toThrowError('SECOND_MOVE_PRIMARY_REQUIRED')
    expect(() => board.applyMove('S+-1,1', 2)).toThrowError('SECOND_MOVE_PRIMARY_REQUIRED')
    expect(() => board.applyMove('S+-1,0', 2)).toThrowError('SECOND_MOVE_PRIMARY_REQUIRED')
    expect(() => board.applyMove('S+0,-1', 2)).toThrowError('SECOND_MOVE_PRIMARY_REQUIRED')
    expect(() => board.applyMove('S+1,-1', 2)).toThrowError('SECOND_MOVE_PRIMARY_REQUIRED')
  })

  test('disallows placement on top of another piece', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    expect(() => board.applyMove('S+0,0', 3)).toThrowError('NO_PLACEMENT_ON_OTHER_PIECES')
    expect(() => board.applyMove('S+1,0', 3)).toThrowError('NO_PLACEMENT_ON_OTHER_PIECES')
  })

  test('disallows placement next to an opponent\'s piece (except first two)', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    expect(() => board.applyMove('S+0,1', 3)).toThrowError('NO_PLACEMENT_NEXT_TO_OPPONENT')
    expect(() => board.applyMove('S+1,1', 3)).toThrowError('NO_PLACEMENT_NEXT_TO_OPPONENT')
    expect(() => board.applyMove('S+2,0', 3)).toThrowError('NO_PLACEMENT_NEXT_TO_OPPONENT')
    expect(() => board.applyMove('S+2,-1', 3)).toThrowError('NO_PLACEMENT_NEXT_TO_OPPONENT')
    expect(() => board.applyMove('S+1,-1', 3)).toThrowError('NO_PLACEMENT_NEXT_TO_OPPONENT')
  })

  test('requires a queen by fourth move', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('S+-1,0', 3)
    board.applyMove('S+2,0', 4)
    board.applyMove('B+-2,0', 5)
    board.applyMove('B+3,0', 6)
    expect(() => board.applyMove('G+-3,0', 7)).toThrowError('QUEEN_REQUIRED_IN_FIRST_FOUR')
    board.applyMove('Q+-3,0', 7)
    expect(() => board.applyMove('G+4,0', 8)).toThrowError('QUEEN_REQUIRED_IN_FIRST_FOUR')
    board.applyMove('Q+4,0', 8)
  })

  test('disallows a move before queen placement for white', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    expect(() => board.applyMove('S>2,0', 3)).toThrowError('NO_MOVE_BEFORE_QUEEN')
  })

  test('disallows a move before queen placement for black', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('S+-1,0', 3)
    expect(() => board.applyMove('S>-1,1', 4)).toThrowError('NO_MOVE_BEFORE_QUEEN')
  })

  test('disallows movement of a piece that doesn\'t exist by implicit origin', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    expect(() => board.applyMove('B>-1,1', 5)).toThrowError('NO_SUCH_PIECE')
  })

  test('disallows movement of a piece that doesn\'t exist by explicit 2D origin', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    expect(() => board.applyMove('B[-1,0]>-1,1', 5)).toThrowError('NO_SUCH_PIECE')
  })

  test('disallows movement of a piece that doesn\'t exist by explicit 3D origin', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    expect(() => board.applyMove('B[-1,0,0]>-1,1', 5)).toThrowError('NO_SUCH_PIECE')
  })

  test('disallows movement with implicit origin when piece is ambiguous', () => {
    const board = new Board()
    board.applyMove('A+0,0', 1)
    board.applyMove('A+1,0', 2)
    board.applyMove('Q+-1,1', 3)
    board.applyMove('A+1,1', 4)
    board.applyMove('A+0,-1', 5)
    board.applyMove('A+2,-1', 6)
    expect(() => board.applyMove('A>2,0', 7)).toThrowError('AMBIGUOUS_ORIGIN_PIECE')
  })

  test('disallows movement of piece trapped under others', () => {
    const board = new Board()
    board.applyMove('A+0,0', 1)
    board.applyMove('A+1,0', 2)
    board.applyMove('Q+-1,1', 3)
    board.applyMove('Q+1,1', 4)
    board.applyMove('B+-2,1', 5)
    board.applyMove('B+2,1', 6)
    board.applyMove('B>-1,1,1', 7)
    board.applyMove('B>1,1,1', 8)
    expect(() => board.applyMove('Q>0,1', 9)).toThrowError('PIECE_TRAPPED_UNDER_ANOTHER')
  })

  test('disallows movement to a taken spot', () => {
    const board = new Board()
    board.applyMove('A+0,0', 1)
    board.applyMove('A+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    expect(() => board.applyMove('Q>0,0', 5)).toThrowError('MOVEMENT_TARGET_OCCUPIED')
    board.applyMove('B+-2,0', 5)
    expect(() => board.applyMove('Q>1,0', 6)).toThrowError('MOVEMENT_TARGET_OCCUPIED')
  })

  test('disallows movement to a spot above the top of the hive', () => {
    const board = new Board()
    board.applyMove('A+0,0', 1)
    board.applyMove('A+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('Q+2,0', 4)
    board.applyMove('B+-2,0', 5)
    board.applyMove('B+3,0', 6)
    expect(() => board.applyMove('B>-1,0,2', 7)).toThrowError('MOVEMENT_TARGET_ABOVE_HIVE')
    expect(() => board.applyMove('B>-1,0,3', 7)).toThrowError('MOVEMENT_TARGET_ABOVE_HIVE')
    board.applyMove('B>-1,0,1', 7)
    expect(() => board.applyMove('B>2,0,2', 8)).toThrowError('MOVEMENT_TARGET_ABOVE_HIVE')
    expect(() => board.applyMove('B>2,0,3', 8)).toThrowError('MOVEMENT_TARGET_ABOVE_HIVE')
    board.applyMove('B>2,0,1', 8)
  })
})

describe('getAdjacentCells', () => {
  test('successfully gets empty adjacent cells', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    expect(board.getAdjacentCells([0, 0])).toEqual([ [], [], [], [], [], [] ])
    expect(board.getAdjacentCells([0, 0], true)).toEqual([
      { cell: [], coords2: [1, 0] },
      { cell: [], coords2: [0, 1] },
      { cell: [], coords2: [-1, 1] },
      { cell: [], coords2: [-1, 0] },
      { cell: [], coords2: [0, -1] },
      { cell: [], coords2: [1, -1] },
    ])
  })

  test('successfully gets primary-filled adjacent cells', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    expect(board.getAdjacentCells([0, 0])).toEqual([ [{ piece: 'S', white: false }], [], [], [], [], [] ])
    expect(board.getAdjacentCells([2, 0])).toEqual([ [], [], [], [{ piece: 'S', white: false }], [], [] ])
  })
})

describe('getValidPlacementLocations', () => {
  test('successfully gives 0,0 and 1,0 as first two placement locations', () => {
    const board = new Board()
    expect(board.getValidPlacementLocations(1)).toEqual([ [0,0] ])
    board.applyMove('S+0,0', 1)
    expect(board.getValidPlacementLocations(2)).toEqual([ [1,0] ])
  })

  test('successfully gets placement locations for black and white in a complex board', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+0,-1', 3)
    board.applyMove('A+2,-1', 4)
    board.applyMove('B+-1,0', 5)
    board.applyMove('Q+1,1', 6)
    board.applyMove('B>0,0,1', 7)
    board.applyMove('A>-1,-1', 8)
    expect(board.getValidPlacementLocations(9)).toEqual([ [-1, 1], [1, -2] ])
    board.applyMove('G+1,-2', 9)
    expect(board.getValidPlacementLocations(10)).toEqual([
      [-1, -2],
      [-2, -1],
      [-2, 0],
      [0, 2],
      [1, 2],
      [2, -1],
      [2, 0],
      [2, 1],
    ])
  })
})

describe('piecesPlaced', () => {
  test('returns correctly after no moves', () => {
    const board = new Board()
    expect(board.piecesPlaced).toEqual({
      white: [],
      black: [],
    })
  })

  test('returns correctly after some valid moves', () => {
    const board = new Board()
    board.applyMove('S+0,0', 1)
    board.applyMove('S+1,0', 2)
    board.applyMove('Q+-1,0', 3)
    board.applyMove('B+2,0', 4)
    expect(board.piecesPlaced).toEqual({
      white: [ { piece: 'Q', coords3: [-1, 0, 0] } , { piece: 'S', coords3: [0, 0, 0] } ],
      black: [ { piece: 'B', coords3: [2, 0, 0] } , { piece: 'S', coords3: [1, 0, 0] } ],
    })
  })
})
