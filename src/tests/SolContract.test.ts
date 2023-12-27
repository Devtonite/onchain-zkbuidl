import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from '../Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, UInt64 } from 'o1js';
import { Bounty } from '../BountyType';
import * as fs from 'fs';


export type user = {
    privateKey: PrivateKey,
    publicKey: PublicKey
}

export type publicState = {
    testHash: Field,
    solutionHash: Field,
    rawTest: string,
    rawSolution: string,
}

let proofsEnabled = false;
let Local;

describe('Solidity', () => {
    let deployer: user, 
        builder: user, 
        hunter: user, 
        verifier: user;
    let zkAppAddress: PublicKey,
        zkAppPrivateKey: PrivateKey,
        zkApp: Core;
    let defaultEmptyHash = Poseidon.hash(stringToFields(''));
    let publiclyViewableState: publicState;


    beforeAll(async () => {

        Local = Mina.LocalBlockchain({proofsEnabled});
        Mina.setActiveInstance(Local);

        deployer = Local.testAccounts[0];
        builder = Local.testAccounts[1];
        hunter = Local.testAccounts[2];
        verifier = Local.testAccounts[3];

        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();

        publiclyViewableState = {
            testHash: Field(0),
            solutionHash: Field(0),
            rawTest: '',
            rawSolution: '',
        }

        zkApp = new Core(zkAppAddress);
        await Core.compile();

    })

    it('DEPLOYER deploys zkApp smart contract', async () => {
        const txn = await Mina.transaction(deployer.publicKey, () => {
            AccountUpdate.fundNewAccount(deployer.publicKey);
            zkApp.deploy();
          });
          await txn.prove();
          await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();

          let bountyState = new Bounty({
            testCommit: defaultEmptyHash,
            solutionCommit: defaultEmptyHash,
            computationCommit: defaultEmptyHash,
            isBountyOpen: Bool(false),
            isVerified: Bool(false),
          })

          expectedOnChainState(zkApp, bountyState);
    });

    it('BUILDER publishes a unit test bounty', async () => {
        let testFileHash = getFileHash('./src/builder/bountyTest.sol.txt')
        
        const txn = await Mina.transaction(builder.publicKey, () => {
          // create a bounty that lasts 24 hours from time of publish
          zkApp.publishBounty(testFileHash, UInt64.from(24));
        });
        await txn.prove();
        await txn.sign([builder.privateKey]).send();
    
        let bountyState = new Bounty({
            testCommit: Poseidon.hash([testFileHash]),
            solutionCommit: defaultEmptyHash,
            computationCommit: defaultEmptyHash,
            isBountyOpen: Bool(true),
            isVerified: Bool(false),
          })
        
        expectedOnChainState(zkApp, bountyState);
        publiclyViewableState.testHash = bountyState.testCommit;
      });

      it('HUNTER commits to a viable code solution', async () => {
        let solutionFileHash = getFileHash('./src/hunter/bountySolution.sol.txt')
        
        const txn = await Mina.transaction(hunter.publicKey, () => {
          zkApp.commitSolution(solutionFileHash);
        });
        await txn.prove();
        await txn.sign([hunter.privateKey]).send();
    
        let bountyState = new Bounty({
            testCommit: publiclyViewableState.testHash,
            solutionCommit: Poseidon.hash([solutionFileHash]),
            computationCommit: defaultEmptyHash,
            isBountyOpen: Bool(false),
            isVerified: Bool(false),
          })
        
        expectedOnChainState(zkApp, bountyState);
        publiclyViewableState.solutionHash = bountyState.solutionCommit
      });

      it('BUILDER publicly releases unit test after 3 days of submissions',async () => {
        // BUILDER waits 3 days for hunter to commit to a solution
        publiclyViewableState.rawTest = './src/builder/bountyTest.sol.txt';
      })

      it('HUNTER computes unit test with code solution and commits to result (after waiting period)', async () => {
        let testFileHash = getFileHash(publiclyViewableState.rawTest);
        let solutionFileHash = getFileHash('./src/hunter/bountySolution.sol.txt')
        let [computation, result] = runSolutionAgainstTest();
        let computationHash = Poseidon.hash(stringToFields(computation))

        const txn = await Mina.transaction(hunter.publicKey, () => {
          zkApp.computeSolution(testFileHash, solutionFileHash, computationHash, result);
        });
        await txn.prove();
        await txn.sign([hunter.privateKey]).send();
    
        let bountyState = new Bounty({
            testCommit: publiclyViewableState.testHash,
            solutionCommit: publiclyViewableState.solutionHash,
            computationCommit: Poseidon.hash([computationHash]),
            isBountyOpen: Bool(false),
            isVerified: Bool(false),
          })
        
        expectedOnChainState(zkApp, bountyState);
        publiclyViewableState.rawSolution = './src/hunter/bountySolution.sol.txt';
      });

      it('VERIFIER runs unit test with code solution to verify the HUNTER\'s passing result', async () => {
        let testFileHash = getFileHash(publiclyViewableState.rawTest);
        let solutionFileHash = getFileHash(publiclyViewableState.rawSolution);
        let [computation, result] = runSolutionAgainstTest();
        let computationHash = Poseidon.hash(stringToFields(computation))

        const txn = await Mina.transaction(hunter.publicKey, () => {
          zkApp.verifySolution(testFileHash, solutionFileHash, computationHash, result);
        });
        await txn.prove();
        await txn.sign([hunter.privateKey]).send();
    
        let bountyState = new Bounty({
            testCommit: publiclyViewableState.testHash,
            solutionCommit: publiclyViewableState.solutionHash,
            computationCommit: Poseidon.hash([computationHash]),
            isBountyOpen: Bool(false),
            isVerified: Bool(true),
          })
        
        expectedOnChainState(zkApp, bountyState);
      });


    function expectedOnChainState(contract: Core, bounty: Bounty) {
        expect(contract.testCommit.get()).toEqual(bounty.testCommit);
        expect(contract.solutionCommit.get()).toEqual(bounty.solutionCommit);
        expect(contract.computationCommit.get()).toEqual(bounty.computationCommit);
        expect(contract.isBountyOpen.get()).toEqual(bounty.isBountyOpen);
        expect(contract.isVerified.get()).toEqual(bounty.isVerified);
    }

    function getFileHash(textFilePath: string): Field {
        let string = fs.readFileSync(textFilePath, 'utf-8');
        let hash = Poseidon.hash(stringToFields(string));
        return hash;
    }

    function getFile(textFilePath: string): string {
        let fileString = fs.readFileSync(textFilePath, 'utf-8');
        return fileString;
    }

    function runSolutionAgainstTest(): [string, Bool] {
        // todo: run the foundry unit test with the committed solution
        return ['The test ran successfully', Bool(true)];
    }
});
