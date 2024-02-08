class Gpu {
  d: GPUDevice | null = null;

  get device(): GPUDevice {
    if (!this.d) {
      throw new Error('device not set')
    }

    return this.d;
  }

  adpapterPromise: Promise<GPUAdapter | null> | null = null;

  devicePromise: Promise<GPUDevice> | null = null;

  async ready(): Promise<boolean> {
    if (this.d) {
      return true;
    }
    
    if (navigator.gpu) {
      if (!this.adpapterPromise) {
        this.adpapterPromise = navigator.gpu.requestAdapter();
      }

      const adapter = await this.adpapterPromise
      this.adpapterPromise = null;
  
      if (adapter) {  
        if (!this.devicePromise) {
          this.devicePromise = adapter.requestDevice();
        }

        this.d = await this.devicePromise
        this.devicePromise = null
      
        return this.d !== undefined;
      }
    }

    return false;
  }
}

export const gpu = new Gpu();

export default Gpu;
