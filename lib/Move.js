const MOVE_REGEX = /^[ABGQS](\[(-?\d+),(-?\d+)(,(-?\d+))?\])?[>+](-?\d+),(-?\d+)(,(-?\d+))?/

class Move {
  constructor(moveString) {
    this._rawString = moveString
    this._postConstructionValidation()
  }

  get isPlacement() { return !!this._rawString.match(/^[A-Z]\+/) }
  get isMovement() { return !this.isPlacement }

  get piece() { return this._rawString.match(/^([A-Z])/)[1] }

  get placementCoords() {
    const match = this._rawString.match(/^[A-Z]\+(-?\d+),(-?\d+)/)
    return [parseInt(match[1], 10), parseInt(match[2], 10)]
  }

  get movementOriginCoords() {
    const match = this._rawString.match(/^[A-Z](\[(-?\d+),(-?\d+)(,(-?\d+))?\])?>(-?\d+),(-?\d+)(,(-?\d+))?/)
    if (match[1] === undefined) { return null }
    const prim = parseInt(match[2])
    const sec = parseInt(match[3])
    const tirt = match[5] !== undefined ? parseInt(match[5]) : 0
    return [ prim, sec, tirt ]
  }
  get hasImplicitOrigin() { return this.movementOriginCoords === null }
  get hasExplicitOrigin() { return !this.hasImplicitOrigin }

  get movementTargetCoords() {
    const match = this._rawString.match(/^[A-Z](\[(-?\d+),(-?\d+)(,(-?\d+))?\])?>(-?\d+),(-?\d+)(,(-?\d+))?/)
    const prim = parseInt(match[6])
    const sec = parseInt(match[7])
    const tirt = match[9] !== undefined ? parseInt(match[9]) : 0
    return [ prim, sec, tirt ]
  }

  _postConstructionValidation() {
    if (!this._rawString.match(MOVE_REGEX)) {
      throw new MoveValidationError('INVALID_MOVE_STRING')
    }
    if (this.isMovement && this.hasExplicitOrigin && this.movementOriginCoords[2] < 0) {
      throw new MoveValidationError('NEGATIVE_MOVEMENT_ORIGIN_Z')
    }
    if (this.isMovement && this.movementTargetCoords[2] < 0) {
      throw new MoveValidationError('NEGATIVE_MOVEMENT_TARGET_Z')
    }
  }

  toString() { return this._rawString }
}

class MoveValidationError extends Error {}

module.exports = { Move, MoveValidationError }
