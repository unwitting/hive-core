const _ = require('lodash')
const hashes = require('jshashes')
const shortid = require('shortid')
const { Board } = require('./Board')
const { Move, MoveValidationError } = require('./Move')

class Game {
  constructor(whitePlayer, blackPlayer, opts={}) {
    this._id = shortid.generate()
    this._hasher = new hashes.SHA256()
    this._board = new Board(opts)
    this._players = [whitePlayer, blackPlayer]
    this._playersBadMoveCount = [0, 0]
    this.whitePlayer.white = true
    this.blackPlayer.white = false
    this._turn = 1
    this._beginHistory()
    this._logFn = opts.logFn
    this._log(`Finished initialising game ${this.id}`)
    this._lastChange = new Date()
    this._timedOut = null
  }

  get id() { return this._id }
  get whitePlayer() { return this._players[0] }
  get blackPlayer() { return this._players[1] }
  get currentPlayer() { return this._getPlayerByTurn(this.turn) }
  get turn() { return this._turn }
  get gameOver() { return this.winner !== null }
  get winner() {
    if (this._timedOut) {
      return (this._timedOut.white ? this.blackPlayer : this.whitePlayer)
    }
    for (const white of [true, false]) {
      const queen = this.board.getQueen(white)
      if (!queen) { continue }
      const occupiedQueenSpaces = _.filter(
        this.board.getAdjacentCells(_.slice(queen.coords3, 0, 2)),
        cell => cell.length > 0
      ).length
      if (occupiedQueenSpaces >= 6) {
        return (white ? this.blackPlayer : this.whitePlayer)
      }
    }
    return null
  }

  get timeSinceLastChange() {
    return (new Date() - this._lastChange)
  }

  get board() { return this._board }

  get history() { return this._history }
  get historyString() { return this.history.join('/') }

  get state() {
    const state = {
      board: this.board.state,
      players: _.map(this._players, p => p.state),
      turn: JSON.parse(JSON.stringify(this._turn))
    }
    if (this.gameOver) {
      state.gameOver = true
      state.winner = JSON.parse(JSON.stringify(this.winner.id))
    } else {
      state.toMove = JSON.parse(JSON.stringify(this.currentPlayer.id))
    }
    const hash = this._hasher.hex(JSON.stringify(state))
    return { state, hash }
  }

  async begin() {
    this._lastChange = new Date()
    try {
      this._log(`Beginning game loop`)
      while (!this.gameOver) {
        this._log(`---`)
        this._log(`Beginning turn ${this.turn}`)
        this._log(`Player ${this.currentPlayer} to move`)
        let move = null
        while (!move) {
          move = await this.currentPlayer.move(this)
          this._lastChange = new Date()
          try {
            this._validateMove(move)
          } catch (e) {
            this._log(`Move ${move} is not valid (${e}), requesting another`)
            const white = (((this.turn - 1) % 2) === 0)
            move = null
            this._playersBadMoveCount = [
              this._playersBadMoveCount[0] + (white ? 1 : 0),
              this._playersBadMoveCount[1] + (white ? 0 : 1),
            ]
            if (this._playersBadMoveCount[white ? 0 : 1] >= 10) {
              this._log(`10 bad moves by ${white ? 'white' : 'black'}, they lose`)
              return await this._endGame(white ? this.blackPlayer : this.whitePlayer)
            }
          }
        }
        this._log(`Received move [ ${move} ] from ${this.currentPlayer}`)
        this._applyMove(move)
        this._lastChange = new Date()
        this._turn++
      }
      return await this._endGame(this.winner)
    } catch(e) {
      this._log(`Unhandled exception in game loop`)
      console.error(e)
    }
  }

  finishDueToTimeout() {
    this._timedOut = this._getPlayerByTurn(this.turn)
  }

  getPlayerById(id) {
    return _.find(this._players, p => p.id === id) || null
  }

  _applyMove(moveString) {
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

  async _endGame(winner) {
    this._log(`Game won by ${winner}`)
    this._lastChange = new Date()
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
    const move = new Move(newMoveString)
    if (move.isPlacement && !_.includes(this.currentPlayer.pieces, move.piece)) {
      throw new MoveValidationError('NO_SUCH_PIECE_IN_HAND')
    }
    this.board.validateMove(move, this.turn)
  }
}

module.exports = { Game }
