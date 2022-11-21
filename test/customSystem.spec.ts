import { TimeSystem } from '../src/examples/customSystem'

describe('Time System', () => {
  it('should test the system', () => {
    const timer = new TimeSystem()
    timer.update(1)
    expect(timer.time).toBe(1)
  })
})