const _ = require('lodash')
const shortid = require('shortid')

const { Game } = require('./lib/Game')
const { Player } = require('./lib/Player')
const { Move } = require('./lib/Move')

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
      if (!game.board.isAdjacentToPiece(move.movementTargetCoords, 'Q', !this.white)) { return true }
      if (game.board.isAdjacentToPiece(move.movementOriginCoords, 'Q', !this.white)) { return true }
      return false
    })
    this._log(`${queenAttackingOnly.length} of those are queen-attacking or placement moves`)
    const moveSet = queenAttackingOnly.length ? queenAttackingOnly : potentialMoves
    const move = moveSet[_.random(moveSet.length - 1)]
    return move
  }
}

const white = new RandomBotPlayer({ logFn: console.log })
const black = new RandomQueenAttackingBotPlayer({ logFn: console.log })

const game = new Game(white, black, { logFn: console.log })
game.begin()
