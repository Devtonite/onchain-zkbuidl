import { Bool, Field, Struct } from "o1js";

export class Bounty extends Struct({
    testCommit: Field,
    solutionCommit: Field,
    hashOfComputation: Field,
    isBountyOpen: Bool,
    isVerified: Bool,
}){}