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


function setTokenAmount(tokenAmount: UInt64, prevProof: VerifyTestHashCircuitProof ): BountyQuest {
    prevProof.verify();
    prevProof.publicOutput.tokenRewardAmount.assertEquals(UInt64.from(0));
    tokenAmount.assertGreaterThanOrEqual(UInt64.from(100));
    let updatedQuest = prevProof.publicOutput;
    updatedQuest.tokenRewardAmount = tokenAmount;
    return updatedQuest;
}
export const SetTokenAmountCircuit = ZkProgram({
    name: "set token amount for bounty",
    publicOutput: BountyQuest,

    methods: {
        setTokenAmount: {
            privateInputs: [UInt64, VerifyTestHashCircuitProof],
            method: setTokenAmount,
        },
    },
});
export class SetTokenAmountCircuitProof extends ZkProgram.Proof(
    SetTokenAmountCircuit
){}


function setBountyDuration(duration: UInt64, prevProof: SetTokenAmountCircuitProof ): BountyQuest {
    prevProof.verify();
    prevProof.publicOutput.bountyDuration.assertEquals(UInt64.from(0));

    duration.assertGreaterThanOrEqual(UInt64.from(1));
    let updatedQuest = prevProof.publicOutput;
    updatedQuest.bountyDuration = duration;
    return updatedQuest;
}
export const SetBountyDurationCircuit = ZkProgram({
    name: "set token amount for bounty",
    publicOutput: BountyQuest,

    methods: {
        setBountyDuration: {
            privateInputs: [UInt64, SetTokenAmountCircuitProof],
            method: setBountyDuration,
        },
    },
});
export class SetBountyDurationCircuitProof extends ZkProgram.Proof(
    SetBountyDurationCircuit
){}