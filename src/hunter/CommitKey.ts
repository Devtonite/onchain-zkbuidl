import { Bool, Field, Poseidon, PrivateKey, PublicKey, SelfProof, Struct, UInt64, ZkProgram } from "o1js";

export class BountyKey extends Struct({
    hunterID: PublicKey,
    solutionHash: Field,
}){}