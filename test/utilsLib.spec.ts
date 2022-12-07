// first import the utilsLib
import { debugMessage, setTimeout, setUVsBasic, setCustomUVs, setBoxUVs } from '../src/utilsLib'

// secondly, create a test to make sure the functions are working
describe('UtilsLib spec', () => {
    it('Should return debug message', () => {
        expect(debugMessage('test')).toBe('test')
    })
    
    it('Should return setUVsBasic', () => {
        expect(setUVsBasic(1, 1)).toStrictEqual([0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1])
    })
    
    it('Should return setCustomUVs', () => {
        expect(setCustomUVs(1, 1, 0, 0)).toStrictEqual([0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1])
    })
    
    it('Should return setBoxUVs', () => {
        expect(setBoxUVs(1, 1)).toStrictEqual([
            0, 0, 1, 0, 1, 1, 0, 1,
            1, 0, 0, 0, 0, 1, 1, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            1, 0, 0, 0, 0, 1, 1, 1,
            1, 0, 0, 0, 0, 1, 1, 1,
            0, 0, 1, 0, 1, 1, 0, 1
        ])
    })
})