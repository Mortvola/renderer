import { common } from "./common";
import { texturedCommon } from "./texturedCommon";
import { texturedFragment } from "./texturedFragment";
import { texturedVertex } from "./texturedVertex";

export const texturedShader = /*wgsl*/`
${texturedCommon}

${common}

${texturedVertex}

${texturedFragment}
`
