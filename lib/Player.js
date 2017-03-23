const _ = require('lodash')
const shortid = require('shortid')

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
    if (game.turn === 1) { return `${this.randomPiece}+0,0` }
    if (game.turn === 2) { return `${this.randomPiece}+1,0` }
    return `${this.randomPiece}+0,0`
  }
}

module.exports = { Player, RandomBotPlayer }
