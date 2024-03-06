import { PipelineInterface, StageBindings } from "../types";

class Pipeline implements PipelineInterface {
  pipeline: GPURenderPipeline;

  vertexStageBindings: StageBindings | null

  fragmentStageBindings: StageBindings | null

  constructor(
    pipeline: GPURenderPipeline,
    vertexStageBindings: StageBindings | null,
    fragmentStageBindings: StageBindings | null,
  ) {
    this.pipeline = pipeline;
    this.vertexStageBindings = vertexStageBindings
    this.fragmentStageBindings = fragmentStageBindings
  }
}

export default Pipeline;
