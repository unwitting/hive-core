const { Move } = require('../Move')

describe('isPlacement', () => {
  test('correctly identifies a placement move', () => {
    expect(new Move('Q+0,0').isPlacement).toBe(true)
    expect(new Move('B+-1,2').isPlacement).toBe(true)
    expect(new Move('B+1,-2').isPlacement).toBe(true)
    expect(new Move('S+-100,-2').isPlacement).toBe(true)
  })

  test('correctly identifies a movement move', () => {
    expect(new Move('Q>0,0').isPlacement).toBe(false)
    expect(new Move('S[10,-1]>13,-1').isPlacement).toBe(false)
    expect(new Move('B[0,0]>-1,0,1').isPlacement).toBe(false)
    expect(new Move('B[0,0,2]>-1,-1,1').isPlacement).toBe(false)
  })
})

describe('isMovement', () => {
  test('correctly identifies a placement move', () => {
    expect(new Move('Q+0,0').isMovement).toBe(false)
    expect(new Move('B+-1,2').isMovement).toBe(false)
    expect(new Move('B+1,-2').isMovement).toBe(false)
    expect(new Move('S+-100,-2').isMovement).toBe(false)
  })

  test('correctly identifies a movement move', () => {
    expect(new Move('Q>0,0').isMovement).toBe(true)
    expect(new Move('S[10,-1]>13,-1').isMovement).toBe(true)
    expect(new Move('B[0,0]>-1,0,1').isMovement).toBe(true)
    expect(new Move('B[0,0,2]>-1,-1,1').isMovement).toBe(true)
  })
})

describe('piece', () => {
  test('correctly identifies a placement move', () => {
    expect(new Move('Q+0,0').piece).toBe('Q')
    expect(new Move('B+-1,2').piece).toBe('B')
    expect(new Move('B+1,-2').piece).toBe('B')
    expect(new Move('S+-100,-2').piece).toBe('S')
  })

  test('correctly identifies a movement move', () => {
    expect(new Move('Q>0,0').piece).toBe('Q')
    expect(new Move('S[10,-1]>13,-1').piece).toBe('S')
    expect(new Move('B[0,0]>-1,0,1').piece).toBe('B')
    expect(new Move('B[0,0,2]>-1,-1,1').piece).toBe('B')
  })
})

describe('placementCoords', () => {
  test('correctly identifies a placement move', () => {
    expect(new Move('Q+0,0').placementCoords).toEqual([0, 0])
    expect(new Move('B+-1,2').placementCoords).toEqual([-1, 2])
    expect(new Move('B+1,-2').placementCoords).toEqual([1, -2])
    expect(new Move('S+-100,-2').placementCoords).toEqual([-100, -2])
  })
})

describe('movementOriginCoords', () => {
  test('correctly identifies a movement move', () => {
    expect(new Move('Q>0,0').movementOriginCoords).toBe(null)
    expect(new Move('S[10,-1]>13,-1').movementOriginCoords).toEqual([10, -1, 0])
    expect(new Move('B[0,0]>-1,0,1').movementOriginCoords).toEqual([0, 0, 0])
    expect(new Move('B[0,0,2]>-1,-1,1').movementOriginCoords).toEqual([0, 0, 2])
  })
})

describe('hasImplicitOrigin', () => {
  test('correctly identifies a move', () => {
    expect(new Move('Q>0,0').hasImplicitOrigin).toBe(true)
    expect(new Move('B>-10,-25,1').hasImplicitOrigin).toBe(true)
    expect(new Move('S[10,-1]>13,-1').hasImplicitOrigin).toEqual(false)
    expect(new Move('B[0,0]>-1,0,1').hasImplicitOrigin).toEqual(false)
    expect(new Move('B[0,0,2]>-1,-1,1').hasImplicitOrigin).toEqual(false)
  })
})

describe('hasExplicitOrigin', () => {
  test('correctly identifies a move', () => {
    expect(new Move('Q>0,0').hasExplicitOrigin).toBe(false)
    expect(new Move('B>-10,-25,1').hasExplicitOrigin).toBe(false)
    expect(new Move('S[10,-1]>13,-1').hasExplicitOrigin).toEqual(true)
    expect(new Move('B[0,0]>-1,0,1').hasExplicitOrigin).toEqual(true)
    expect(new Move('B[0,0,2]>-1,-1,1').hasExplicitOrigin).toEqual(true)
  })
})

describe('movementTargetCoords', () => {
  test('correctly identifies a movement move', () => {
    expect(new Move('Q>0,0').movementTargetCoords).toEqual([0, 0, 0])
    expect(new Move('S[10,-1]>13,-1').movementTargetCoords).toEqual([13, -1, 0])
    expect(new Move('B[0,0]>-1,0,1').movementTargetCoords).toEqual([-1, 0, 1])
    expect(new Move('B[0,0,2]>-1,-1,1').movementTargetCoords).toEqual([-1, -1, 1])
  })
})
