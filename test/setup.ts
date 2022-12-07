import * as ecs from 'decentraland-ecs'

type Ecs = { self: typeof ecs }
/**
 * Override @Component for testing purpose.
 */
const Component = (ecs as any as Ecs).self.Component
;(globalThis as any).Component = Component

/**
 * Override @Entity for testing purpose.
 */
const Entity = (ecs as any as Ecs).self.Entity
;(globalThis as any).Entity = Entity

const engine = (ecs as any as Ecs).self.engine;
(globalThis as any).engine = engine

const UICanvas = (ecs as any as Ecs).self.UICanvas
;(globalThis as any).UICanvas = UICanvas

const Font = (ecs as any as Ecs).self.Font
;(globalThis as any).Font = Font

const Fonts = (ecs as any as Ecs).self.Fonts
;(globalThis as any).Fonts = Fonts

const UIText = (ecs as any as Ecs).self.UIText
;(globalThis as any).UIText = UIText

const Texture = (ecs as any as Ecs).self.Texture;
(globalThis as any).Texture = Texture

const Transform = (ecs as any as Ecs).self.Transform;
(globalThis as any).Transform = Transform

const Shape = (ecs as any as Ecs).self.Shape;
(globalThis as any).Shape = Shape

const PlaneShape = (ecs as any as Ecs).self.PlaneShape;
(globalThis as any).PlaneShape = PlaneShape