import type { Layer, StepLayer } from "@src/data/project"
import { type mat3, type mat4, vec3 } from "gl-matrix"
import type REGL from "regl"
import { ShapeRenderer, type ShapeRendererProps } from "./shape-renderer"
import type { WorldContext } from "./view"

function typedArrayEquals(a: mat3 | mat4 | Float32Array, b: mat3 | mat4 | Float32Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export interface LayerProps {
  dataLayer: StepLayer
  visible?: boolean
  color?: vec3
  alpha?: number
}

export interface LayerRendererProps extends Omit<ShapeRendererProps, "image">, LayerProps {}

interface LayerUniforms {
  u_Color: vec3
  u_Alpha: number
  u_ZOffset: number
}

type LayerAttributes = {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public dataLayer: StepLayer
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public alpha: number = 1

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  private artworkChanged = false
  private prevViewportWidth = -1
  private prevViewportHeight = -1
  private prevZOffset = NaN
  private prevTransformMatrix: mat3 | null = null
  private prevLayerMatrix: mat3 | null = null
  private prevColor: vec3 = vec3.fromValues(NaN, NaN, NaN)

  constructor(props: LayerRendererProps) {
    const image = props.dataLayer.artwork
    super({ ...props, image })
    this.dataLayer = props.dataLayer

    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.alpha !== undefined) {
      this.alpha = props.alpha
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }

    this.framebuffer = this.regl.framebuffer()

    this.layerConfig = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, WorldContext>({
      depth: {
        enable: true,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
      uniforms: {
        u_Color: () => this.color,
        u_Alpha: () => this.alpha,
        u_ZOffset: (context) => context.zOffset || 0.0,
      },
    })

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  private needsRender(context: REGL.DefaultContext & WorldContext): boolean {
    const colorChanged =
      this.color[0] !== this.prevColor[0] ||
      this.color[1] !== this.prevColor[1] ||
      this.color[2] !== this.prevColor[2]
    const contextChanged =
      context.viewportWidth !== this.prevViewportWidth ||
      context.viewportHeight !== this.prevViewportHeight ||
      context.zOffset !== this.prevZOffset ||
      this.prevTransformMatrix === null ||
      !typedArrayEquals(context.transformMatrix, this.prevTransformMatrix)
    const transformChanged =
      this.prevLayerMatrix === null ||
      !typedArrayEquals(this.transform.matrix, this.prevLayerMatrix)

    if (!this.artworkChanged && !colorChanged && !contextChanged && !transformChanged) {
      return false
    }

    this.prevViewportWidth = context.viewportWidth
    this.prevViewportHeight = context.viewportHeight
    this.prevZOffset = context.zOffset
    this.prevTransformMatrix = Float32Array.from(context.transformMatrix) as unknown as mat3
    this.prevLayerMatrix = Float32Array.from(this.transform.matrix) as unknown as mat3
    vec3.copy(this.prevColor, this.color)
    this.artworkChanged = false
    return true
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    if (!this.needsRender(context)) return

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        super.render(context)
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}

interface SelectionRendererProps extends ShapeRendererProps {
  sourceLayer: Layer
}

export class SelectionRenderer extends ShapeRenderer {
  private selectionConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  public sourceLayer: Layer

  private artworkChanged = false
  private prevViewportWidth = -1
  private prevViewportHeight = -1
  private prevZOffset = NaN
  private prevTransformMatrix: mat3 | null = null
  private prevLayerMatrix: mat3 | null = null

  constructor(props: SelectionRendererProps) {
    super(props)
    this.sourceLayer = props.sourceLayer

    this.framebuffer = this.regl.framebuffer()

    this.selectionConfig = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, WorldContext>({
      depth: {
        enable: true,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
      uniforms: {
        u_Color: vec3.fromValues(0.5, 0.5, 0.5),
        u_Alpha: 0.7,
        u_ZOffset: (context) => context.zOffset || 0.0,
      },
    })

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  private needsRender(context: REGL.DefaultContext & WorldContext): boolean {
    const contextChanged =
      context.viewportWidth !== this.prevViewportWidth ||
      context.viewportHeight !== this.prevViewportHeight ||
      context.zOffset !== this.prevZOffset ||
      this.prevTransformMatrix === null ||
      !typedArrayEquals(context.transformMatrix, this.prevTransformMatrix)
    const transformChanged =
      this.prevLayerMatrix === null ||
      !typedArrayEquals(this.transform.matrix, this.prevLayerMatrix)

    if (!this.artworkChanged && !contextChanged && !transformChanged) {
      return false
    }

    this.prevViewportWidth = context.viewportWidth
    this.prevViewportHeight = context.viewportHeight
    this.prevZOffset = context.zOffset
    this.prevTransformMatrix = Float32Array.from(context.transformMatrix) as unknown as mat3
    this.prevLayerMatrix = Float32Array.from(this.transform.matrix) as unknown as mat3
    this.artworkChanged = false
    return true
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    if (!this.needsRender(context)) return
    // if (settings.ENABLE_3D) return

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.selectionConfig(() => {
        super.render(context)
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}
