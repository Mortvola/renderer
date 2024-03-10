import { gpu } from "./Gpu";

class BindGroups {
  private bindGroupLayout0: GPUBindGroupLayout | null = null;

  private bindGroupLayout1: GPUBindGroupLayout | null = null;

  private bindGroupLayout2: GPUBindGroupLayout | null = null;

  private bindGroupLayout2A: GPUBindGroupLayout | null = null;

  private bindGroupLayout3: GPUBindGroupLayout | null = null;

  getBindGroupLayout0() {
    if (this.bindGroupLayout0) {
      return this.bindGroupLayout0;
    }

    this.bindGroupLayout0 = gpu.device.createBindGroupLayout({
      label: 'group0',
      entries: [
        { // Projection matrix
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // View matrix
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Inverse View matrix
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {},
        },
        { // Camera position
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Camera position
          binding: 4,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Light data
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'read-only-storage',
          },
        },
        { // Circle data
          binding: 6,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'read-only-storage',
          },
        },
        { // time
          binding: 7,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ]
    })

    return this.bindGroupLayout0;
  }

  getBindGroupLayout1() {
    if (this.bindGroupLayout1) {
      return this.bindGroupLayout1;
    }

    this.bindGroupLayout1 = gpu.device.createBindGroupLayout({
      label: 'group1',
      entries: [
        { // Model matrix
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Instance color
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Inverse model matrix
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ]
    });

    return this.bindGroupLayout1;
  }

  getBindGroupLayout2() {
    if (this.bindGroupLayout2) {
      return this.bindGroupLayout2;
    }

    this.bindGroupLayout2 = gpu.device.createBindGroupLayout({
      label: 'group2',
      entries: [
        { // Color
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Sampler
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        { // Texture 2D
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        { // Attributes
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ]
    });

    return this.bindGroupLayout2;
  }

  getBindGroupLayout2A() {
    if (this.bindGroupLayout2A) {
      return this.bindGroupLayout2A;
    }

    this.bindGroupLayout2A = gpu.device.createBindGroupLayout({
      label: 'group2A',
      entries: [
        { // Color
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
      ]
    });

    return this.bindGroupLayout2A;
  }

  getBindGroupLayout3() {
    if (this.bindGroupLayout3) {
      return this.bindGroupLayout3;
    }

    this.bindGroupLayout3 = gpu.device.createBindGroupLayout({
      label: 'group3',
      entries: [
        { // Circle data, reticle radius
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
      ]
    });

    return this.bindGroupLayout3;
  }

}

export const bindGroups = new BindGroups();

export default BindGroups;