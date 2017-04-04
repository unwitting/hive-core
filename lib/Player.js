const _ = require('lodash')
const shortid = require('shortid')

const { Move } = require('./move')

class Player {
  constructor(id, opts={}) {
    this._id = id
    this._initialisePieces()
    this._logFn = opts.logFn
    this._log(`Finished initialising player ${this.id}`)
  }

  get id() { return this._id }
  get pieces() { return _.sortBy(this._pieces) }
  get piecesString() { return this.pieces.join('') }
  get white() { return this._white }

  set white(w) { this._white = w }

  async acknowledgeState(game) { throw new Error(`Unimplemented acknowledgeState()`) }
  async move(game) { throw new Error(`Unimplemented move()`) }

  removePiece(piece) {
    const index = _.indexOf(this._pieces, piece)
    if (index === -1) { return }
    this._pieces.splice(index, 1)
  }

  toString() {
    return `${this.id}`
  }

  _getAllPossibleMoves(game) {
    if (game.turn === 1) { return [`${this.randomPiece}+0,0`] }
    if (game.turn === 2) { return [`${this.randomPiece}+1,0`] }
    let mustPlayQueen = false
    if ((game.turn === 7 || game.turn === 8) && _.includes(this.pieces, 'Q')) {
      mustPlayQueen = true
    }

    const potentialMoves = []

    const validPlacementLocations = game.board.getValidPlacementLocations(game.turn)
    const canPlace = this.pieces.length && validPlacementLocations.length
    if (canPlace) {
      for (const coords of validPlacementLocations) {
        for (const piece of _.uniqBy(this.pieces)) {
          if (mustPlayQueen && piece !== 'Q') { continue }
          potentialMoves.push(`${piece}+${coords.join(',')}`)
        }
      }
    }

    const canMove = !_.includes(this.pieces, 'Q')
    if (canMove) {
      const playedPieces = game.board.piecesPlaced[this.white ? 'white': 'black']
      for (const {piece, coords3} of playedPieces) {
        for (const movementTarget of game.board.getValidMovementTargets(coords3, game.turn)) {
          potentialMoves.push(`${piece}[${coords3.join(',')}]>${movementTarget.join(',')}`)
        }
      }
    }

    return potentialMoves
  }

  _initialisePieces() {
    this._pieces = ['Q', 'A', 'A', 'A', 'S', 'S', 'G', 'G', 'B', 'B']
  }

  _log(s) {
    if (!this._logFn) { return }
    this._logFn(`Hive [Player:${this.id}] : ${s}`)
  }
}

class BotPlayer extends Player {
  async acknowledgeState(game) { return }

  get randomPiece() { return this.pieces[_.random(0, this.pieces.length - 1)] }
}

class RandomBotPlayer extends BotPlayer {
  constructor(opts) {
    super(`RandomBot:${shortid.generate()}`, opts)
  }

  async move(game) {
    const potentialMoves = this._getAllPossibleMoves(game)
    const move = potentialMoves[_.random(potentialMoves.length - 1)]
    this._log(`I have ${potentialMoves.length} moves available for turn ${game.turn}`)
    return move
  }
}

class RandomQueenAttackingBotPlayer extends BotPlayer {
  constructor(opts) {
    super(`RandomQueenAttackingBot:${shortid.generate()}`, opts)
  }

  async move(game) {
    const potentialMoves = this._getAllPossibleMoves(game)
    this._log(`I have ${potentialMoves.length} moves available for turn ${game.turn}`)
    const queenAttackingOnly = _.reject(potentialMoves, moveString => {
      const move = new Move(moveString)
      if (!move.isMovement) { return false }
      return !game.board.isAdjacentToPiece(move.movementTargetCoords, 'Q', !this.white)
    })
    this._log(`${queenAttackingOnly.length} of those are queen-attacking or placement moves`)
    const moveSet = queenAttackingOnly.length ? queenAttackingOnly : potentialMoves
    const move = moveSet[_.random(moveSet.length - 1)]
    return move
  }
}

module.exports = { Player, RandomBotPlayer, RandomQueenAttackingBotPlayer }
