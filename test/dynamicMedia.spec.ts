// first, import the dynamicMedia, and Entity from decentraland ecs
import { Entity, PlaneShape, Texture, Transform } from 'decentraland-ecs'
import { DynamicMedia } from '../src/entities/dynamicMedia'

// secondly, create a test to make sure dynamicMedia is working
describe('DynamicMedia spec', () => {
    (globalThis as any).Entity = Entity

    it('Should return entity', () => {
        const dynamicMedia = new DynamicMedia(new Texture(""), new PlaneShape(), new Transform())
        expect(dynamicMedia).toBe(Entity)
    })
})