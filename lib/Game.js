const _ = require('lodash')
const shortid = require('shortid')
const { Board, MoveValidationError } = require('./Board')
const { Move } = require('./Move')

class Game {
  constructor(whitePlayer, blackPlayer, opts={}) {
    this._id = shortid.generate()
    this._board = new Board(opts)
    this._players = [whitePlayer, blackPlayer]
    this.whitePlayer.white = true
    this.blackPlayer.white = false
    this._turn = 1
    this._beginHistory()
    this._logFn = opts.logFn
    this._log(`Finished initialising game ${this.id}`)
  }

  get id() { return this._id }
  get whitePlayer() { return this._players[0] }
  get blackPlayer() { return this._players[1] }
  get currentPlayer() { return this._getPlayerByTurn(this.turn) }
  get turn() { return this._turn }
  get gameOver() { return this.winner !== null }
  get winner() { return this.turn >= 15 ? this.whitePlayer : null }  // TODO

  get board() { return this._board }

  get history() { return this._history }
  get historyString() { return this.history.join('/') }

  async begin() {
    this._log(`Beginning game loop`)
    while (!this.gameOver) {
      this._log(`Beginning turn ${this.turn}`)
      this._log(`Player ${this.currentPlayer} to move`)
      await this._ensureConsistentState()
      let move = null
      while (!move) {
        move = await this.currentPlayer.move(this)
        try {
          this._validateMove(move)
        } catch (e) {
          this._log(`Move ${move} is not valid (${e}), requesting another`)
          // await this.currentPlayer.informMoveInvalid(move)  // TODO
          move = null
        }
      }
      this._log(`Received move [ ${move} ] from ${this.currentPlayer}`)
      this._applyMove(move)
      this._turn++
      await this._ensureConsistentState()
    }
    this._log(`Game won by ${this.winner}`)
  }

  _applyMove(moveString) {
    this._log(`Applying move [ ${moveString} ] to game board`)
    this._history.push(moveString)
    const move = this.board.applyMove(moveString, this.turn)
    // Remove piece from player
    if (move.isPlacement) {
      this.currentPlayer.removePiece(move.piece)
    }
  }

  _beginHistory() {
    this._history = []
    this._history.push(this.whitePlayer.piecesString)
    this._history.push(this.blackPlayer.piecesString)
  }

  async _ensureConsistentState() {
    this._log('Ensuring all players have consistent state information')
    await Promise.all(this._players.map(p => p.acknowledgeState(this)))
  }

  _getPlayerByTurn(turn) {
    return this._players[(turn - 1) % 2]
  }

  _log(s) {
    if (!this._logFn) { return }
    this._logFn(`Hive [Game:${this.id}] : ${s}`)
  }

  _validateMove(newMoveString) {
    // Do this by creating a fresh game and applying all moves in history to
    // it, followed by this new one - boards do validation
    this._log(`Validating move ${newMoveString}`)
    const tmpBoard = new Board()
    let turn = 1
    for (const moveString of _.slice(this.history, 2)) {
      tmpBoard.applyMove(moveString, turn)
      turn++
    }
    const move = new Move(newMoveString)
    if (!_.includes(this.currentPlayer.pieces, move.piece)) {
      throw new MoveValidationError('NO_SUCH_PIECE_IN_HAND')
    }
    tmpBoard.applyMove(move, turn)
  }
}

module.exports = { Game }
