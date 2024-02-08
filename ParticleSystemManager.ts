import Http from "../Http/src";
import ParticleSystem from "./ParticleSystem";
import { ParticleRecord } from "./types";

class ParticleSystemManager { 
  map: Map<number, ParticleSystem> = new Map()

  loading: Promise<ParticleSystem | undefined> | null = null

  async getParticleSystem(id: number) {
    let ps = this.map.get(id);

    if (!ps) {
      if (!this.loading) {
        this.loading = this.load(id);

        ps = await this.loading

        if (ps) {
          this.map.set(id, ps)
        }  
      }
      else {
        ps = await this.loading
      }

      this.loading = null;
    }

    return ps;
  }

  private async load(id: number) {
    const response = await Http.get<ParticleRecord>(`/particles/${id}`)

    if (response.ok) {
      const rec = await response.body();

      const particleSystem = await ParticleSystem.create(rec.id, rec.descriptor);

      return particleSystem;
    }  
  }
}

export const particleSystemManager = new ParticleSystemManager()

export default ParticleSystemManager;
