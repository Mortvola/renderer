class Gpu {
  d: GPUDevice | null = null;

  get device(): GPUDevice {
    if (!this.d) {
      throw new Error('device not set')
    }

    return this.d;
  }

  async ready(): Promise<boolean> {
    if (this.d) {
      return true;
    }
    
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
  
      if (adapter) {  
         this.d = await adapter.requestDevice();
      
        return this.d !== undefined;
      }
    }

    return false;
  }
}

export const gpu = new Gpu();

export default Gpu;
