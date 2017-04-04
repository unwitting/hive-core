const { Game } = require('./lib/Game')
const { RandomBotPlayer, RandomQueenAttackingBotPlayer } = require('./lib/Player')

const white = new RandomBotPlayer({ logFn: console.log })
const black = new RandomQueenAttackingBotPlayer({ logFn: console.log })

const game = new Game(white, black, { logFn: console.log })
game.begin()
