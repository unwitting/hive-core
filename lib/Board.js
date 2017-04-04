const _ = require('lodash')
const shortid = require('shortid')
const { Move, MoveValidationError } = require('./Move')

class Board {
  constructor(opts={}) {
    this._id = shortid.generate()
    this._cells = {}
    this._opts = opts
    this._logFn = opts.logFn
    this._log(`Finished initialising board ${this.id}`)
  }

  get clone() {
    const newBoard = new Board()
    newBoard._cells = JSON.parse(JSON.stringify(this._cells))
    return newBoard
  }
  get id() { return this._id }
  get piecesPlaced() {
    const placed = { white: [], black: [] }
    for (const coords in this._cells) {
      if (!this._cells.hasOwnProperty(coords)) { continue }
      const cell = this._cells[coords]
      cell.forEach((tile, i) => {
        const coords3 = [...coords.split(',').map(x => parseInt(x, 10)), i]
        if (tile.white) { placed.white.push({ piece: tile.piece, coords3 }) }
        else { placed.black.push({ piece: tile.piece, coords3 }) }
      })
    }
    placed.white = _.sortBy(placed.white, t => t.piece)
    placed.black = _.sortBy(placed.black, t => t.piece)
    return placed
  }

  get _occupiedAndAdjacentCoord2s() {
    const occupiedCoordKeys = _(this._cells).keys().filter(k => this._getCell(k.split(',')).length > 0).value()
    const occupiedAndAdjacent = (_(occupiedCoordKeys)
      .map(k => k.split(',').map(v => parseInt(v, 10)))
      .map(c => this.getAdjacentCells(c, true))
      .flatten()
      .map(c => c.coords2.join(','))
      .uniq()
      .sortBy()
      .map(k => k.split(',').map(v => parseInt(v, 10)))
      .value())
    return occupiedAndAdjacent
  }

  applyMove(move, turn) {
    if (!turn) { throw new Error('turn argument required for applyMove') }
    if (_.isString(move)) { move = new Move(move) }
    this._log(`Applying move [ ${move} ] for turn ${turn}`)
    const white = ((turn - 1) % 2) === 0
    const piecesPlacedByCurrentPlayer = this.piecesPlaced[white ? 'white' : 'black']
    const piecesPlayedPiecesOnly = piecesPlacedByCurrentPlayer.map(t => t.piece)
    if (move.isPlacement) {
      // Validate move
      if (turn <= 2 && move.piece === 'Q') {
        throw new MoveValidationError('NO_QUEEN_FIRST')
      }
      if (turn === 1 && (move.placementCoords[0] !== 0 || move.placementCoords[1] !== 0)) {
        throw new MoveValidationError('FIRST_MOVE_ORIGIN_REQUIRED')
      }
      if (turn === 2 && (move.placementCoords[0] !== 1 || move.placementCoords[1] !== 0)) {
        throw new MoveValidationError('SECOND_MOVE_PRIMARY_REQUIRED')
      }
      if ((turn === 7 || turn === 8) && !_.includes(piecesPlayedPiecesOnly, 'Q') && move.piece !== 'Q') {
        throw new MoveValidationError('QUEEN_REQUIRED_IN_FIRST_FOUR')
      }
      if (this._getCell(move.placementCoords).length) {
        throw new MoveValidationError('NO_PLACEMENT_ON_OTHER_PIECES')
      }
      if (turn > 2) {
        for (const cell of this.getAdjacentCells(move.placementCoords)) {
          if (cell.length === 0) { continue }
          if (cell[cell.length - 1].white !== white) {
            throw new MoveValidationError('NO_PLACEMENT_NEXT_TO_OPPONENT')
          }
        }
      }
      // Apply move
      this._addToTopOfCell(move.placementCoords, { white, piece: move.piece })
    }
    if (move.isMovement) {
      // Validate move
      if (!_.includes(piecesPlayedPiecesOnly, 'Q')) {
        throw new MoveValidationError('NO_MOVE_BEFORE_QUEEN')
      }
      let origin = null
      if (move.hasImplicitOrigin) {
        let samePlayed = 0
        for (const alreadyPlayed of piecesPlacedByCurrentPlayer) {
          if (alreadyPlayed.piece === move.piece) {
            samePlayed++
            origin = alreadyPlayed.coords3
            if (samePlayed > 1) {
              throw new MoveValidationError('AMBIGUOUS_ORIGIN_PIECE')
            }
          }
        }
        if (samePlayed === 0) {
          throw new MoveValidationError('NO_SUCH_PIECE')
        }
      }
      if (move.hasExplicitOrigin) {
        origin = move.movementOriginCoords
        const cell = this._getCell(move.movementOriginCoords)
        if (cell.length <= move.movementOriginCoords[2] ||
            cell[move.movementOriginCoords[2]].piece !== move.piece) {
          throw new MoveValidationError('NO_SUCH_PIECE')
        }
      }
      if (this._getCell(origin).length > (origin[2] + 1)) {
        throw new MoveValidationError('PIECE_TRAPPED_UNDER_ANOTHER')
      }
      if (move.movementTargetCoords[2] < this._getCell(move.movementTargetCoords).length) {
        throw new MoveValidationError('MOVEMENT_TARGET_OCCUPIED')
      }
      if (move.movementTargetCoords[2] > this._getCell(move.movementTargetCoords).length) {
        throw new MoveValidationError('MOVEMENT_TARGET_ABOVE_HIVE')
      }
      // TODO piece-specific movement rules
      // Disallow climbing for non-climbers
      if (_.includes(['Q', 'A', 'S', 'G'], move.piece)) {
        if (move.movementTargetCoords[2] > 0) {
          throw new MoveValidationError('CANNOT_CLIMB')
        }
      }
      let isSlider = false
      if (_.includes(['Q', 'A', 'S', 'B'], move.piece)) {
        isSlider = true
      }
      // Compare intended around-hive move against valid paths for sliders
      if (isSlider) {
        const allowClimbing = (move.piece === 'B' ? 2 : 0)
        let paths = this.getPathsAroundHive(origin, move.movementTargetCoords, allowClimbing)
        if (_.includes(['Q', 'B'], move.piece)) {
          paths = _.filter(paths, p => p.length === 2)
        }
        if (move.piece === 'S') {
          paths = _.filter(paths, p => p.length === 4)
        }
        if (paths.length === 0) {
          throw new MoveValidationError('NO_VALID_PATH')
        }
      }
      // Validate hop paths for hoppers
      if (move.piece === 'G') {
        const paths = this.getHopPathsFromOrigin(origin)
        const landingSites = _.map(paths, _.last)
        if (!_.find(landingSites, c => (c[0] === move.movementTargetCoords[0] && c[1] === move.movementTargetCoords[1]))) {
          throw new MoveValidationError('NO_VALID_PATH')
        }
      }
      this._moveTopToTopOfCell(origin, move.movementTargetCoords)
    }
    return move
  }

  getAdjacentCells(coords2, richWithCoords=false) {
    return [
      [ coords2[0] + 1, coords2[1] ],
      [ coords2[0], coords2[1] + 1 ],
      [ coords2[0] - 1, coords2[1] + 1 ],
      [ coords2[0] - 1, coords2[1] ],
      [ coords2[0], coords2[1] - 1 ],
      [ coords2[0] + 1, coords2[1] - 1 ],
    ].map(adjCoords2 => (richWithCoords ? {
      coords2: adjCoords2,
      cell: this._getCell(adjCoords2)
    } : this._getCell(adjCoords2)))
  }

  getHopPathsFromOrigin(coords2) {
    return _([ [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1] ]).map(hopVector => {
      let current = [coords2[0] + hopVector[0], coords2[1] + hopVector[1]]
      let numCleared = 0
      while (this._getCell(current).length > 0) {
        current = [current[0] + hopVector[0], current[1] + hopVector[1]]
        numCleared++
      }
      if (numCleared === 0) { return null }
      return [coords2, current]
    }).reject(p => p === null).value()
  }

  getPathsAroundHive(origin, dest, allowClimbing=0, _currentPath=null) {
    if (_currentPath === null) { _currentPath = [origin] }
    if (allowClimbing !== 0 && _currentPath.length === allowClimbing) { return null }
    const adjacentCells = this.getAdjacentCells(origin, true)
    // Trawl through the adjacents for something valid
    const validNextSteps =
      _(adjacentCells)
      // Filter out non-empty cells
      .reject(({cell}) => (allowClimbing === 0 && cell.length > 0))
      // Filter out cells with no adjacent occupied cells (away from hive) apart from path start
      .reject(({coords2}) => {
        return _.filter(this.getAdjacentCells(coords2, true), c => {
          const adjCoords = c.coords2
          const { cell } = c
          return ((cell.length === 0) || (adjCoords[0] === _currentPath[0][0] && adjCoords[1] === _currentPath[0][1]))
        }).length === 6
      })
      // Filter out cells already in the path
      .reject(({coords2}) => !!_.find(_currentPath, c => (c[0] === coords2[0] && c[1] === coords2[1])))
      // Reject cells with no occupied shared neighbours (hive break)
      .reject(({coords2}) => {
        const nextZ = this._getCell(coords2).length
        if ((allowClimbing !== 0) && (nextZ > 0)) { return false }
        const sharedNeighbours = this._getSharedNeighbours(_currentPath[_currentPath.length - 1], coords2)
        return _(sharedNeighbours).filter(n => this._getCell(n).length > 0).value().length === 0
      })
      // Reject cells with two occupied shared neighbours with at least the same Z value as origin
      .reject(({coords2}) => {
        const originZ = this._getCell(origin).length - 1
        const sharedNeighbours = this._getSharedNeighbours(_currentPath[_currentPath.length - 1], coords2)
        return _(sharedNeighbours).filter(n => this._getCell(n).length > originZ).value().length === 2
      })
      .value()
    if (validNextSteps.length === 0) {
      // No good paths this way
      return []
    }
    // If dest is in valid next steps, we're done this path
    if (_.filter(validNextSteps, ({coords2}) => (coords2[0] === dest[0] && coords2[1] === dest[1])).length > 0) {
      return [[origin, dest]]
    }
    const validPaths = []
    for (const {coords2} of validNextSteps) {
      const newCurrentPath = JSON.parse(JSON.stringify(_currentPath))
      newCurrentPath.push(coords2)
      // Create a board in which the move to the next step has been made
      const nextStepBoard = this.clone
      nextStepBoard._moveTopToTopOfCell(_currentPath[_currentPath.length - 1], coords2)
      // Recurse, but on the _new_ board, to represent the up-to-date state in-move
      const pathFinishers = nextStepBoard.getPathsAroundHive(coords2, dest, allowClimbing, newCurrentPath)
      if (pathFinishers === null) { continue }
      for (const pathFinish of pathFinishers) {
        validPaths.push([ origin, ...pathFinish ])
      }
    }
    return validPaths
  }

  getQueen(white) {
    const piecesPlaced = this.piecesPlaced[white ? 'white' : 'black']
    return _.find(piecesPlaced, p => p.piece === 'Q') || null
  }

  getValidPlacementLocations(turn) {
    if (turn === 1) { return [ [0,0] ] }
    if (turn === 2) { return [ [1,0] ] }
    const white = ((turn - 1) % 2) === 0
    return _(
      this.piecesPlaced[white ? 'white' : 'black'])
      // Get the unique coordinates of all player pieces
      .map(p => _.slice(p.coords3, 0, 2))
      .uniqBy(coords2 => coords2.join('|'))
      // Get the cells adjacent to all player pieces
      .map(coords2 => this.getAdjacentCells(coords2, true))
      .flatten()
      .uniqBy(({ coords2 }) => coords2.join('|'))
      .sortBy(({ coords2 }) => coords2.join('|'))
      // Get only the empty cells adjacent to all player pieces
      .filter(cellInfo => cellInfo.cell.length === 0)
      // Get the adjacent cells to those empty spaces
      .map(({ coords2 }) => ({ coords2, adjacents: this.getAdjacentCells(coords2, true) }))
      // Filter for the ones which have no adjacent opponent pieces
      .filter(tileSet => _(
        tileSet.adjacents)
        // Get top tile or null of all tiles in set
        .map(t => (t.cell.length === 0 ? null : t.cell[t.cell.length - 1]))
        // Filter out nulls
        .reject(p => p === null)
        // Get opponent's ones only
        .filter(p => p.white !== white)
        .value().length === 0
      )
      // Get coords of all such empty spots
      .map(tileSet => tileSet.coords2)
      // Sort them (mostly for testing purposes)
      .sortBy(coords2 => coords2.join('|'))
      // Voila
      .value()
  }

  getValidMovementTargets(originCoords3, turn) {
    const piece = this._getCell(originCoords3)[originCoords3[2]].piece
    const validTargets = []
    for (const occupiedOrAdjacentCoord2 of this._occupiedAndAdjacentCoord2s) {
      const topOfCellCoords3 = [...occupiedOrAdjacentCoord2, this._getCell(occupiedOrAdjacentCoord2).length]
      const moveString = `${piece}[${originCoords3.join(',')}]>${topOfCellCoords3}`
      try {
        this.clone.applyMove(moveString, turn)
        validTargets.push(topOfCellCoords3)
      } catch(e) {}
    }
    return validTargets
  }

  _addToTopOfCell(coords2, tile) {
    const coordsKey = this._getCellCoordsKey(coords2)
    this._log(`Adding tile ${JSON.stringify(tile)} to top of cell at ${coordsKey}`)
    if (!this._cells[coordsKey]) { this._cells[coordsKey] = [] }
    this._cells[coordsKey].push(tile)
  }

  _cellsAreAdjacent(coords2A, coords2B) {
    const adjCoords = _(this.getAdjacentCells(coords2A, true)).map(c => c.coords2).value()
    const match = _.find(adjCoords, c => (c[0] === coords2B[0] && c[1] === coords2B[1]))
    return !!match
  }

  _moveTopToTopOfCell(origin, dest) {
    // Apply move - pop piece from its origin...
    const origin2 = [ origin[0], origin[1] ]
    const originCellKey = this._getCellCoordsKey(origin)
    const originCell = this._cells[originCellKey]
    const piece = JSON.parse(JSON.stringify(originCell[originCell.length - 1])).piece
    const white = JSON.parse(JSON.stringify(originCell[originCell.length - 1])).white
    originCell.splice(originCell.length - 1, 1)
    // And add it at the target
    const target2 = [ dest[0], dest[1] ]
    const cell = this._getCell(dest)
    cell.push({ piece, white })
    this._cells[this._getCellCoordsKey(target2)] = cell
  }

  _getCell(coords) {
    const coords2 = [coords[0], coords[1]]
    const coordsKey = this._getCellCoordsKey(coords2)
    return this._cells[coordsKey] || []
  }

  _getCellCoordsKey(coords2) {
    return `${coords2[0]},${coords2[1]}`
  }

  _getSharedNeighbours(coordsA, coordsB) {
    const adjA = this.getAdjacentCells(coordsA, true)
    const adjB = this.getAdjacentCells(coordsB, true)
    return _(adjA).filter(adjCellA => {
      return _.find(adjB, adjCellB => (adjCellA.coords2[0] === adjCellB.coords2[0] && adjCellA.coords2[1] === adjCellB.coords2[1]))
    }).map(c => c.coords2).value()
  }

  _log(s) {
    if (!this._logFn) { return }
    this._logFn(`Hive [Board:${this.id}] : ${s}`)
  }
}

module.exports = { Board }
