import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool } from 'o1js';

let proofsEnabled = false;

describe('Core', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    builderAccount: PublicKey,
    builderKey: PrivateKey,
    hunterAccount: PublicKey,
    hunterKey: PrivateKey,
    verifierAccount: PublicKey,
    verifierKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Core;

  beforeAll(async () => {
    if (proofsEnabled) await Core.compile();

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: builderKey, publicKey: builderAccount } =
      Local.testAccounts[1]);
    ({ privateKey: hunterKey, publicKey: hunterAccount } =
      Local.testAccounts[2]);
    ({ privateKey: verifierKey, publicKey: verifierAccount } =
      Local.testAccounts[3]);
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
    expect(zkApp.hashOfComputation.get()).toEqual(Field(0));
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));

  });

  // This first proof naively begins the bounty process.
  // BUILDER submits a unit test with a token bounty
  it('BUILDER publishes a unit test bounty', async () => {

    let rawTestString = "This is a test";
    let testFields = stringToFields(rawTestString);
    let testHash = Poseidon.hash(testFields);

    const txn = await Mina.transaction(builderAccount, () => {
      zkApp.publishBounty(testHash);
    });
    await txn.prove();
    await txn.sign([builderKey]).send();
    
    expect(zkApp.solutionCommit.get()).toEqual(Field(0));
    expect(zkApp.hashOfComputation.get()).toEqual(Field(0));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));
    
    let newTestHash = zkApp.testCommmit.get();
    expect(newTestHash).toEqual(testHash);
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(true));
  });

  it('HUNTER commits to a viable code solution', async () => {

    let rawSolutionString = "This is a solution";
    let solutionFields = stringToFields(rawSolutionString);
    let soluionHash = Poseidon.hash(solutionFields);

    const txn = await Mina.transaction(hunterAccount, () => {
      zkApp.commitSolution(soluionHash);
    });
    await txn.prove();
    await txn.sign([hunterKey]).send();

    // can't check for testCommit because unit test is still private here.
    expect(zkApp.hashOfComputation.get()).toEqual(Field(0));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));
    
    let onChainSolutionHash = zkApp.solutionCommit.get();
    expect(onChainSolutionHash).toEqual(soluionHash);
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
  });

  it('HUNTER computes unit test with code solution and commits to result (after waiting period)', async () => {

    //  note: these are all currently dummy values (if it wasn't already obvious). ---------
    let rawTestString = "This is a test";
    let testFields = stringToFields(rawTestString);
    let testHash = Poseidon.hash(testFields);

    let rawSolutionString = "This is a solution";
    let solutionFields = stringToFields(rawSolutionString);
    let soluionHash = Poseidon.hash(solutionFields);

    let rawComputeString = `${rawTestString} + ${rawSolutionString} = the test has passed.`;
    let computeFields = stringToFields(rawComputeString);
    let computeHash = Poseidon.hash(computeFields);

    // since we assume the unit test + code solution pairing has passed.
    let result = Bool(true);
    // dummy values end. -------------------------------------------------------------------

    const txn = await Mina.transaction(hunterAccount, () => {
      zkApp.computeSolution(testHash, soluionHash, computeHash, result);
    });
    await txn.prove();
    await txn.sign([hunterKey]).send();

    expect(zkApp.testCommmit.get()).toEqual(testHash);
    expect(zkApp.solutionCommit.get()).toEqual(soluionHash);
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
    
    expect(zkApp.hashOfComputation.get()).toEqual(computeHash); 
  });

  // This last proof naively verifies the correct computation
  // HUNTER redeems the token bounty for providing a correct code solution
  it('VERIFIER runs unit test with code solution to verify a passsing result', async () => {

    //  note: these are all currently dummy values (if it wasn't already obvious). ---------
    let rawTestString = "This is a test";
    let testFields = stringToFields(rawTestString);
    let testHash = Poseidon.hash(testFields);

    let rawSolutionString = "This is a solution";
    let solutionFields = stringToFields(rawSolutionString);
    let soluionHash = Poseidon.hash(solutionFields);

    let rawComputeString = `${rawTestString} + ${rawSolutionString} = the test has passed.`;
    let computeFields = stringToFields(rawComputeString);
    let computeHash = Poseidon.hash(computeFields);

    // since we assume the unit test + code solution pairing has passed.
    let result = Bool(true);
    // dummy values end. -------------------------------------------------------------------

    const txn = await Mina.transaction(verifierAccount, () => {
      zkApp.verifySolution(testHash, soluionHash, computeHash, result);
    });
    await txn.prove();
    await txn.sign([verifierKey]).send();

    expect(zkApp.testCommmit.get()).toEqual(testHash);
    expect(zkApp.solutionCommit.get()).toEqual(soluionHash);

    expect(zkApp.hashOfComputation.get()).toEqual(computeHash); 
    expect(zkApp.isVerified.get()).toEqual(result);
  });

});
