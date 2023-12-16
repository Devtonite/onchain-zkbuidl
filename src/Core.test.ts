import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool } from 'o1js';

let proofsEnabled = false;

describe('Core', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Core;

  beforeAll(async () => {
    if (proofsEnabled) await Core.compile();

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Core(zkAppAddress);

    await localDeploy();
  });


  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Core` smart contract', async () => {

    expect(zkApp.testCommmit.get()).toEqual(Field(0));
    expect(zkApp.solutionCommit.get()).toEqual(Field(0));
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));

  });

  it('BUILDER publishes a unit test bounty', async () => {

    let rawTestString = "This is a test";
    let testFields = stringToFields(rawTestString);
    let testHash = Poseidon.hash(testFields);

    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.publishBounty(testHash);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    let onchainTestHash = zkApp.testCommmit.get();

    expect(onchainTestHash).toEqual(testHash);
    expect(zkApp.solutionCommit.get()).toEqual(Field(0));
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(true));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));

  });

  it('HUNTER commits to a viable code solution', async () => {

    let rawSolutionString = "This is a solution";
    let solutionFields = stringToFields(rawSolutionString);
    let soluionHash = Poseidon.hash(solutionFields);

    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.commitSolution(soluionHash);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    let onChainSolutionHash = zkApp.solutionCommit.get();

    expect(onChainSolutionHash).toEqual(soluionHash);
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));

  });

});
