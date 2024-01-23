import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, UInt64 } from 'o1js';
import { Core } from './Core';
import { BountyQuest } from './builder/BuildQuest';

let proofsEnabled = false;
let Local;

describe('On Chain Testing', () => {
    
    Local = Mina.LocalBlockchain({proofsEnabled});
    Mina.setActiveInstance(Local);

    let deployer = Local.testAccounts[0];
    let builder = Local.testAccounts[1];
    let hunter = Local.testAccounts[2];
    let verifier = Local.testAccounts[3];
    
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();
    let zkApp = new Core(zkAppAddress);

    beforeAll(async () => {
        await Core.compile();
    })

    it('deploys zkApp smart contract', async () => {
        
        const txn = await Mina.transaction(deployer.publicKey, () => {
            AccountUpdate.fundNewAccount(deployer.publicKey);
            zkApp.deploy();
        });
        await txn.prove();
        await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
    });

    it('publishes new bounty', async () => {

        console.log(Mina.getBalance(builder.publicKey).toJSON())
        console.log(Mina.getBalance(zkAppAddress).toJSON())

        
        let rawTestHash = Poseidon.hash(stringToFields('This is a test.'))
        let initBountyQuest = new BountyQuest({
            builderID: builder.publicKey,
            testHash: Poseidon.hash([rawTestHash]),
            tokenRewardAmount: UInt64.from(578643),
            bountyDuration: UInt64.from(1000)
        })
        
        const txn = await Mina.transaction(builder.publicKey, () => {
            zkApp.publishBountyQuest(initBountyQuest);
        });
        await txn.prove();
        await txn.sign([builder.privateKey]).send();

        console.log(Mina.getBalance(builder.publicKey).toJSON())
        console.log(Mina.getBalance(zkAppAddress).toJSON())

    });

});
