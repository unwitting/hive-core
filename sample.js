const { Game } = require('./lib/Game')
const { RandomBotPlayer } = require('./lib/Player')

const white = new RandomBotPlayer({ logFn: console.log })
const black = new RandomBotPlayer({ logFn: console.log })

const game = new Game(white, black, { logFn: console.log })
game.begin()
