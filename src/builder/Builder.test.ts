import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, VerificationKey, SelfProof, UInt64 } from 'o1js';
import { BountyQuest, SetBountyDurationCircuit, SetBountyDurationCircuitProof, SetTokenAmountCircuit, SetTokenAmountCircuitProof, VerifyBuilderIDCircuit, VerifyBuilderIDCircuitProof, VerifyTestHashCircuit, VerifyTestHashCircuitProof } from './BuildQuest';

let proofsEnabled = true;

describe('Build Quest Testing', () => {

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    let minaBuilder = Local.testAccounts[0];
    let rawTestString = 'This is a test';
    let rawTestHash = Poseidon.hash(stringToFields(rawTestString));
    
    let proof1: VerifyBuilderIDCircuitProof;
    let proof2: VerifyTestHashCircuitProof;
    let proof3: SetTokenAmountCircuitProof;
    let proof4: SetBountyDurationCircuitProof;


    let initBountyQuest = new BountyQuest({
        builderID: minaBuilder.publicKey,
        testHash: Poseidon.hash([rawTestHash]),
        tokenRewardAmount: UInt64.from(0),
        bountyDuration: UInt64.from(0)
    })
    
    it('verifies builderID', async () => {
        await VerifyBuilderIDCircuit.compile();

        proof1 = await VerifyBuilderIDCircuit.createNewBounty(initBountyQuest, minaBuilder.privateKey)
        console.log(proof1)
    });

    it('verifies test hash', async () => {
        await VerifyTestHashCircuit.compile();

        proof2 = await VerifyTestHashCircuit.addTestHash(rawTestHash, proof1)
        console.log(proof2)
    });

    it('adds bounty token amount', async () => {
        await SetTokenAmountCircuit.compile();
        let myTokenBounty = UInt64.from(1000);

        proof3 = await SetTokenAmountCircuit.setTokenAmount(myTokenBounty, proof2)
        console.log(proof3)
    });

    it('adds bounty duration', async () => {
        await SetBountyDurationCircuit.compile();
        let myDuration = UInt64.from(1000);
        proof4 = await SetBountyDurationCircuit.setBountyDuration(myDuration, proof3)
        console.log(proof4)
    });

    it('displays final BountyQuest output', async () => {
        let questToSubmitOnchain = proof4.publicOutput;
        let summary = [
            questToSubmitOnchain.builderID.toJSON(),
            questToSubmitOnchain.testHash.toJSON(),
            questToSubmitOnchain.tokenRewardAmount.toJSON(),
            questToSubmitOnchain.bountyDuration.toJSON(),
        ]
        console.log(summary);
    })


});