import { Bool, Field, Poseidon, PrivateKey, PublicKey, SelfProof, Struct, UInt64, ZkProgram } from "o1js";

export class BountyQuest extends Struct({
    builderID: PublicKey,
    testHash: Field,
    tokenRewardAmount: UInt64,
    bountyDuration: UInt64,
}){}


function verifyBuilder(quest: BountyQuest, privK: PrivateKey): BountyQuest {
    let pubK = privK.toPublicKey();
    pubK.assertEquals(quest.builderID);
    return quest;
}
export const VerifyBuilderIDCircuit = ZkProgram({
    name: "verify builder id",
    publicInput: BountyQuest,
    publicOutput: BountyQuest,

    methods: {
        createNewBounty: {
            privateInputs: [PrivateKey],
            method: verifyBuilder,
        },
    },
});
export class VerifyBuilderIDCircuitProof extends ZkProgram.Proof(
    VerifyBuilderIDCircuit
){}


function verifyTestHash(rawTestHash: Field, prevProof: VerifyBuilderIDCircuitProof ): BountyQuest {
    prevProof.verify();
    let questTestHash = Poseidon.hash([rawTestHash]);
    questTestHash.assertEquals(prevProof.publicOutput.testHash);
    return prevProof.publicOutput;
}
export const VerifyTestHashCircuit = ZkProgram({
    name: "verify test hash",
    publicOutput: BountyQuest,

    methods: {
        addTestHash: {
            privateInputs: [Field, VerifyBuilderIDCircuitProof],
            method: verifyTestHash,
        },
    },
});
export class VerifyTestHashCircuitProof extends ZkProgram.Proof(
    VerifyTestHashCircuit
){}