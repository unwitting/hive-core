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

  describe('queen', () => {
    test('allows valid queen moves', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      // Apply attempted next moves to clones of the board
      board.clone.applyMove('Q>-1,1', 5)
      board.clone.applyMove('Q>0,-1', 5)
      board.applyMove('Q>0,-1', 5)
      // Same for black
      board.clone.applyMove('Q>1,1', 6)
      board.clone.applyMove('Q>2,-1', 6)
    })

    test('cannot move more than 1 space', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      // Apply attempted next moves to clones of the board
      expect(() => board.applyMove('Q>0,1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>1,1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>2,1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>1,-1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>2,-1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>3,-1', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('Q>3,0', 5)).toThrowError('NO_VALID_PATH')
    })

    test('cannot climb onto hive', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      // Attempt to move onto hive
      expect(() => board.applyMove('Q>0,0,1', 5)).toThrowError('CANNOT_CLIMB')
      board.applyMove('Q>0,-1', 5)
      expect(() => board.applyMove('Q>1,0,1', 6)).toThrowError('CANNOT_CLIMB')
    })

    test('cannot violate freedom of movement', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: true}],
        '-1,1': [{piece: 'A', white: true}],
      }
      // Attempt to move into impossible gap
      expect(() => board.applyMove('Q>0,1', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate one hive rule', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: true}],
        '-1,1': [{piece: 'A', white: true}],
      }
      // Attempt to split hive
      expect(() => board.applyMove('Q>-1,0', 6)).toThrowError('NO_VALID_PATH')
    })
  })

  describe('ant', () => {
    test('allows valid ant moves', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('A+-2,0', 5)
      board.applyMove('A+3,0', 6)
      // Apply attempted next moves to clones of the board
      board.clone.applyMove('A>-2,1', 7)
      board.clone.applyMove('A>-1,1', 7)
      board.clone.applyMove('A>0,1', 7)
      board.clone.applyMove('A>1,1', 7)
      board.clone.applyMove('A>2,1', 7)
      board.clone.applyMove('A>3,1', 7)
      board.clone.applyMove('A>4,0', 7)
      board.clone.applyMove('A>4,-1', 7)
      board.clone.applyMove('A>3,-1', 7)
      board.clone.applyMove('A>2,-1', 7)
      board.clone.applyMove('A>1,-1', 7)
      board.clone.applyMove('A>0,-1', 7)
      board.clone.applyMove('A>-1,-1', 7)
    })

    test('cannot climb onto hive', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('A+-2,0', 5)
      board.applyMove('A+3,0', 6)
      // Attempt to move onto hive
      expect(() => board.applyMove('A>-1,0,1', 7)).toThrowError('CANNOT_CLIMB')
    })

    test('cannot violate freedom of movement', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: true}],
        '-1,1': [{piece: 'A', white: true}],
      }
      // Attempt to move into impossible gap
      expect(() => board.applyMove('A[-1,1]>0,1', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate one hive rule', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'A', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '0,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'Q', white: true}],
      }
      // Attempt to split hive
      expect(() => board.applyMove('A[0,0]>0,-1', 7)).toThrowError('NO_VALID_PATH')
    })
  })

  describe('spider', () => {
    test('allows valid spider moves', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('S+-2,0', 5)
      board.applyMove('S+3,0', 6)
      // Apply attempted next moves to clones of the board
      board.clone.applyMove('S>0,1', 7)
      board.clone.applyMove('S>1,-1', 7)
    })

    test('cannot move more or less than 3 spaces', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('S+-2,0', 5)
      board.applyMove('S+3,0', 6)
      // Apply attempted next moves to clones of the board
      expect(() => board.applyMove('S>-1,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('S>1,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('S>0,-1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('S>2,-1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('S>-2,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('S>4,0', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot climb onto hive', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('S+-2,0', 5)
      board.applyMove('S+3,0', 6)
      // Attempt to move onto hive
      expect(() => board.applyMove('S>1,0,1', 7)).toThrowError('CANNOT_CLIMB')
    })

    test('cannot violate freedom of movement', () => {
      const board = new Board()
      board._cells = {
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: true}],
        '-1,2': [{piece: 'Q', white: true}],
        '-1,1': [{piece: 'A', white: true}],
        '2,-1': [{piece: 'S', white: true}],
      }
      // Attempt to move into impossible gap
      expect(() => board.applyMove('S>0,1', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate one hive rule', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'S', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '0,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'Q', white: true}],
      }
      // Attempt to split hive
      expect(() => board.applyMove('S[0,0]>0,-3', 7)).toThrowError('NO_VALID_PATH')
    })
  })

  describe('grasshopper', () => {
    test('allows valid grasshopper moves', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('G+-2,0', 5)
      board.applyMove('G+2,1', 6)
      // Apply attempted next moves
      board.applyMove('G>3,0', 7)
      board.clone.applyMove('G>2,-1', 8)
      board.clone.applyMove('G>4,-1', 8)
    })

    test('allows valid grasshopper moves out of and into a gap', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '1,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'Q', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,0': [{piece: 'B', white: false}],

        '0,1': [{piece: 'G', white: true}],
      }
      // Apply attempted next moves
      board.clone.applyMove('G>0,-1', 9)
      board.applyMove('G>2,-1', 9)

      board.applyMove('B>-2,1', 10)
      board.applyMove('G>0,1', 11)
    })

    test('cannot jump over a gap', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '1,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'Q', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,0': [{piece: 'B', white: false}],

        '0,-1': [{piece: 'G', white: true}],
      }
      // Apply attempted next moves
      expect(() => board.applyMove('G>0,3', 9)).toThrowError('NO_VALID_PATH')
    })

    test('cannot jump in an off-straight line', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '1,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'Q', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,0': [{piece: 'B', white: false}],

        '1,-1': [{piece: 'G', white: true}],
      }
      // Apply attempted next moves
      expect(() => board.applyMove('G>0,1', 9)).toThrowError('NO_VALID_PATH')
    })

    test('cannot jump a single space', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '1,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'Q', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,0': [{piece: 'B', white: false}],

        '1,-1': [{piece: 'G', white: true}],
      }
      // Apply attempted next moves
      expect(() => board.applyMove('G>2,-1', 9)).toThrowError('NO_VALID_PATH')
    })

    test('cannot climb onto hive', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('G+-2,0', 5)
      board.applyMove('G+3,0', 6)
      // Attempt to move onto hive
      expect(() => board.applyMove('G>-1,0,1', 7)).toThrowError('CANNOT_CLIMB')
      expect(() => board.applyMove('G>0,0,1', 7)).toThrowError('CANNOT_CLIMB')
    })

    test('cannot violate one hive rule', () => {
      const board = new Board()
      board.applyMove('A+0,0', 1)
      board.applyMove('A+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('G+-2,0', 5)
      board.applyMove('G+2,1', 6)
      // Attempt to split hive
      expect(() => board.applyMove('G>-3,0', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('G>-3,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('G>-2,-1', 7)).toThrowError('NO_VALID_PATH')
    })
  })

  describe('beetle', () => {
    test('allows valid beetle moves around hive', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '1,1': [{piece: 'A', white: true}],
        '0,2': [{piece: 'Q', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-1,1': [{piece: 'A', white: false}],
        '-1,0': [{piece: 'B', white: false}],

        '0,-1': [{piece: 'B', white: true}],
      }
      // Apply attempted next moves
      board.clone.applyMove('B>1,-1', 9)
      board.clone.applyMove('B>-1,-1', 9)
    })

    test('cannot move more than 1 space', () => {
      const board = new Board()
      board.applyMove('S+0,0', 1)
      board.applyMove('S+1,0', 2)
      board.applyMove('Q+-1,0', 3)
      board.applyMove('Q+2,0', 4)
      board.applyMove('B+-2,0', 5)
      board.applyMove('B+3,0', 6)
      // Apply attempted next moves
      expect(() => board.applyMove('B>-1,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>0,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>1,1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>0,-1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>1,-1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>2,-1', 7)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>4,0', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate freedom of movement', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'B', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'Q', white: true}],
        '-1,1': [{piece: 'A', white: true}],
      }
      // Attempt to move into impossible gap
      expect(() => board.applyMove('B>0,1', 7)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate freedom of movement above the hive', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'S', white: true}, {piece: 'B', white: true}],
        '1,0': [{piece: 'Q', white: false}, {piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'Q', white: true}],
        '-1,1': [{piece: 'A', white: true}, {piece: 'A', white: true}],
        '0,1': [{piece: 'S', white: true}]
      }
      // Attempt to move into impossible gap (implicit and explicit)
      expect(() => board.applyMove('B[0,0,1]>0,1,1', 11)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>0,1,1', 11)).toThrowError('NO_VALID_PATH')
    })

    test('cannot violate one hive rule', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'B', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '1,1': [{piece: 'A', white: false}],
        '0,2': [{piece: 'A', white: true}],
        '-1,2': [{piece: 'Q', white: true}],
      }
      // Attempt to split hive
      expect(() => board.applyMove('B>-1,0', 5)).toThrowError('NO_VALID_PATH')
      expect(() => board.applyMove('B>-1,1', 5)).toThrowError('NO_VALID_PATH')
    })

    test('allows valid beetle moves onto the hive and back down', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'Q', white: true}],
        '-1,0': [{piece: 'B', white: true}],
        '1,0': [{piece: 'Q', white: false}],
        '2,0': [{piece: 'B', white: false}],
        '0,1': [{piece: 'A', white: true}],
        '1,-1': [{piece: 'A', white: false}],
      }
      // Apply attempted next moves
      board.applyMove('B>0,0,1', 7)
      board.applyMove('B>1,0,1', 8)
      board.applyMove('B>1,0,2', 9)
      expect(() => board.applyMove('B>0,0,1', 10)).toThrowError('PIECE_TRAPPED_UNDER_ANOTHER')
      board.applyMove('A>2,-1', 10)
      board.applyMove('B>2,0', 11)
      board.applyMove('B>0,0,1', 12)
    })
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

describe('getValidMovementTargets', () => {
  test('finds all valid movement targets for a queen', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'Q', white: true}],
      '1,0': [{piece: 'A', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board.getValidMovementTargets([0, 0, 0], 5)).toEqual([ [0, 1, 0], [1, -1, 0] ])
  })

  test('finds all valid movement targets for a spider', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'S', white: true}],
      '1,0': [{piece: 'Q', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board.getValidMovementTargets([0, 0, 0], 5)).toEqual([ [2, 1, 0], [3, -1, 0] ])
  })

  test('finds all valid movement targets for an ant', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'A', white: true}],
      '1,0': [{piece: 'Q', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board.getValidMovementTargets([0, 0, 0], 5)).toEqual([
      [0, 1, 0],
      [1, -1, 0],
      [1, 1, 0],
      [2, -1, 0],
      [2, 1, 0],
      [3, -1, 0],
      [3, 1, 0],
      [4, -1, 0],
      [4, 0, 0],
    ])
  })

  test('finds all valid movement targets for a grasshopper', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'G', white: true}],
      '1,0': [{piece: 'Q', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board.getValidMovementTargets([0, 0, 0], 5)).toEqual([ [4, 0, 0] ])
  })

  test('finds all valid movement targets for a beetle', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'B', white: true}],
      '1,0': [{piece: 'Q', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board.getValidMovementTargets([0, 0, 0], 5)).toEqual([ [0, 1, 0], [1, -1, 0], [1, 0, 1] ])
  })
})

describe('_occupiedAndAdjacentCoord2s', () => {
  test('finds all occupied and adjacent coords', () => {
    const board = new Board()
    board._cells = {
      '0,0': [{piece: 'Q', white: true}],
      '1,0': [{piece: 'A', white: true}],
      '2,0': [{piece: 'Q', white: false}],
      '3,0': [{piece: 'A', white: false}],
    }
    expect(board._occupiedAndAdjacentCoord2s).toEqual([
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
      [2, -1],
      [2, 0],
      [2, 1],
      [3, -1],
      [3, 0],
      [3, 1],
      [4, -1],
      [4, 0],
    ])
  })
})

describe('pathfinding', () => {
  describe('getPathsAroundHive', () => {
    test('finds all clear paths at Z = 0 around a straight hive', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'A', white: true}],
        '1,0': [{piece: 'Q', white: true}],
        '2,0': [{piece: 'Q', white: false}],
        '3,0': [{piece: 'A', white: false}],
      }
      expect(board.getPathsAroundHive([0, 0], [4, 0])).toEqual([
        [ [0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 0] ],
        [ [0, 0], [1, -1], [2, -1], [3, -1], [4, -1], [4, 0] ],
      ])
    })

    test('finds all clear paths around an off-straight hive', () => {
      const board = new Board()
      board._cells = {
        '0,1': [{piece: 'A', white: true}],
        '1,0': [{piece: 'Q', white: true}],
        '2,0': [{piece: 'Q', white: false}],
        '3,0': [{piece: 'A', white: false}],
      }
      expect(board.getPathsAroundHive([0, 1], [4, 0])).toEqual([
        [ [0, 1], [1, 1], [2, 1], [3, 1], [4, 0] ],
        [ [0, 1], [0, 0], [1, -1], [2, -1], [3, -1], [4, -1], [4, 0] ],
      ])
    })

    test('finds no path to not-free-to-move spot', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'A', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '2,0': [{piece: 'Q', white: true}],
        '2,1': [{piece: 'A', white: true}],
        '1,2': [{piece: 'Q', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-2,2': [{piece: 'A', white: false}],
      }
      expect(board.getPathsAroundHive([0, 0], [1, 1])).toEqual([])
    })

    test('correctly identifies that jumping directly across gap is invalid', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'A', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '2,0': [{piece: 'Q', white: true}],
        '2,1': [{piece: 'A', white: true}],
        '1,2': [{piece: 'Q', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-2,2': [{piece: 'A', white: false}],
      }
      expect(board.getPathsAroundHive([0, 0], [-1, 1])).toContainEqual([ [0, 0], [0, 1], [-1, 1] ])
      expect(board.getPathsAroundHive([0, 0], [-1, 1])).not.toContainEqual([ [0, 0], [-1, 1] ])
      expect(board.getPathsAroundHive([0, 0], [-1, 1]).length).toBe(2)
    })

    test('handles path from cell to itself', () => {
      const board = new Board()
      board._cells = {
        '0,0': [{piece: 'A', white: true}],
        '1,0': [{piece: 'A', white: true}],
        '2,0': [{piece: 'Q', white: true}],
        '2,1': [{piece: 'A', white: true}],
        '1,2': [{piece: 'Q', white: false}],
        '0,2': [{piece: 'A', white: false}],
        '-1,2': [{piece: 'A', white: false}],
        '-2,2': [{piece: 'A', white: false}],
      }
      expect(board.getPathsAroundHive([0, 0], [0, 0])).toEqual([])
    })
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

describe('_getSharedNeighbours', () => {
  test('returns correctly shared coords between two adjacent cells', () => {
    const board = new Board()
    expect(board._getSharedNeighbours([0, 0], [1, 0])).toEqual([[0, 1], [1, -1]])
    expect(board._getSharedNeighbours([0, 0], [0, 1])).toEqual([[1, 0], [-1, 1]])
  })

  test('returns correctly shared coord between coords with one space between', () => {
    const board = new Board()
    expect(board._getSharedNeighbours([0, 0], [2, 0])).toEqual([[1, 0]])
    expect(board._getSharedNeighbours([0, 0], [0, 2])).toEqual([[0, 1]])
  })

  test('returns no shared coords between far-apart coords', () => {
    const board = new Board()
    expect(board._getSharedNeighbours([0, 0], [3, 0])).toEqual([])
    expect(board._getSharedNeighbours([0, 0], [0, 3])).toEqual([])
  })
})
