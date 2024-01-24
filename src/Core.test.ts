import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, UInt64, UInt32 } from 'o1js';
import { Core } from './Core';
import { BountyQuest } from './builder/BuildQuest';
import { BountyKey } from './hunter/CommitKey';

let proofsEnabled = true;
let Local = Mina.LocalBlockchain({proofsEnabled});


describe('On Chain Testing', () => {
    
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

        console.log('Builder builds and funds a bounty')
        printAllBalances();
        
        let rawTestHash = Poseidon.hash(stringToFields('This is a test.'))
        let initBountyQuest = new BountyQuest({
            builderID: builder.publicKey,
            testHash: Poseidon.hash([rawTestHash]),
            tokenRewardAmount: UInt64.from(5e5),
            bountyDuration: UInt64.from(1e15)
        })
        
        const txn = await Mina.transaction(builder.publicKey, () => {
            zkApp.publishBountyQuest(initBountyQuest);
        });
        await txn.prove();
        await txn.sign([builder.privateKey]).send();

        printAllBalances();

    });

    // it('commits to a bounty solution', async () => {

    //     console.log('Hunter commits to a solution')

    //     let rawSolutionHash = Poseidon.hash(stringToFields('This is a solution.'))
    //     let bountyKeyCommit = new BountyKey({
    //         hunterID: hunter.publicKey,
    //         solutionHash: Poseidon.hash([rawSolutionHash])
    //     })
        
    //     const txn = await Mina.transaction(hunter.publicKey, () => {
    //         zkApp.commitBountyKey(bountyKeyCommit);
    //     });
    //     await txn.prove();
    //     await txn.sign([hunter.privateKey]).send();

    // });

    // it('rewards valid bounty solution', async () => {

    //     console.log('Verifier validates solution from hunter and releases reward')


    //     printAllBalances();

    //     let rawTestHash = Poseidon.hash(stringToFields('This is a test.'))
    //     let rawSolutionHash = Poseidon.hash(stringToFields('This is a solution.'))
    //     let computationHash = Poseidon.hash(stringToFields('Result from computing solution with test.'))
    //     let didTestPass = Bool(true);

    //     const txn = await Mina.transaction(verifier.publicKey, () => {
    //         zkApp.rewardWinner(rawTestHash, rawSolutionHash, computationHash, didTestPass );
    //     });
    //     await txn.prove();
    //     await txn.sign([verifier.privateKey]).send();

    //     printAllBalances();

    // });


    // HELPER TESTING FUNCTIONS
    function printAllBalances() {
        let builderBal = Mina.getBalance(builder.publicKey).toString();
        let hunterBal = Mina.getBalance(hunter.publicKey).toString();
        let zkAppBal = Mina.getBalance(zkAppAddress).toString();

        console.log(
            ` builder : ${builderBal} \n hunter  : ${hunterBal} \n zkApp   : ${zkAppBal} `)
    }

    function globalSlotToTimestamp1() {
        let { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
        let slot = Mina.activeInstance.getNetworkState().globalSlotSinceGenesis;
        return UInt64.from(slot).mul(slotTime).add(genesisTimestamp)
      }
    
    function globalSlotToTimestamp2() {
        let { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
        let slot = Mina.activeInstance.currentSlot();
        return UInt64.from(slot).mul(slotTime).add(genesisTimestamp);
      }
});

