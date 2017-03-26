const _ = require('lodash')
const shortid = require('shortid')
const { Move, MoveValidationError } = require('./Move')

class Board {
  constructor(opts={}) {
    this._id = shortid.generate()
    this._cells = {}
    this._logFn = opts.logFn
    this._log(`Finished initialising board ${this.id}`)
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
      // TODO freedom of movement
      // TODO one hive
      // Apply move - pop piece from its origin...
      const origin2 = [ origin[0], origin[1] ]
      this._cells[this._getCellCoordsKey(origin2)].splice(origin[2], 1)
      // And add it at the target
      const target2 = [ move.movementTargetCoords[0], move.movementTargetCoords[1] ]
      const cell = this._getCell(move.movementTargetCoords)
      cell.push({ piece: move.piece, white })
      this._cells[this._getCellCoordsKey(target2)] = cell
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

  getValidPlacementLocations(turn) {
    if (turn === 1) { return [ [0,0] ] }
    if (turn === 2) { return [ [1,0] ] }
    const white = ((turn - 1) % 2) === 0
    return _.
      chain(this.piecesPlaced[white ? 'white' : 'black'])
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
      .filter(tileSet => _.
        chain(tileSet.adjacents)
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

  _addToTopOfCell(coords2, tile) {
    const coordsKey = this._getCellCoordsKey(coords2)
    this._log(`Adding tile ${JSON.stringify(tile)} to top of cell at ${coordsKey}`)
    if (!this._cells[coordsKey]) { this._cells[coordsKey] = [] }
    this._cells[coordsKey].push(tile)
  }

  _getCell(coords) {
    const coords2 = [coords[0], coords[1]]
    const coordsKey = this._getCellCoordsKey(coords2)
    return this._cells[coordsKey] || []
  }

  _getCellCoordsKey(coords2) {
    return `${coords2[0]},${coords2[1]}`
  }

  _log(s) {
    if (!this._logFn) { return }
    this._logFn(`Hive [Board:${this.id}] : ${s}`)
  }
}

module.exports = { Board }
