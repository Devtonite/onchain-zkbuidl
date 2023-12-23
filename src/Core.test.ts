import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool } from 'o1js';
import { Bounty } from './BountyType';

let proofsEnabled = true;

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

  let emptyHash = Poseidon.hash(stringToFields(''));

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

    let bounty = new Bounty({
      testCommit: emptyHash,
      solutionCommit: emptyHash,
      computationCommit: emptyHash,
      isBountyOpen: Bool(false),
      isVerified: Bool(false),
    });

    expect(zkApp.testCommmit.get()).toEqual(bounty.testCommit);
    expect(zkApp.solutionCommit.get()).toEqual(bounty.solutionCommit);
    expect(zkApp.computationCommit.get()).toEqual(bounty.computationCommit);
    expect(zkApp.isBountyOpen.get()).toEqual(bounty.isBountyOpen);
    expect(zkApp.isVerified.get()).toEqual(bounty.isVerified);

  });

  // This first proof naively begins the bounty process.
  // BUILDER submits a unit test with a token bounty
  it('BUILDER publishes a unit test bounty', async () => {

    let testHash = Poseidon.hash(stringToFields('This is a test'));
    let irrelevantBool = Bool(false);


    let oldStatebounty = new Bounty({
      testCommit: testHash, // input
      solutionCommit: emptyHash,
      computationCommit: emptyHash,
      isBountyOpen: irrelevantBool,
      isVerified: irrelevantBool,
    });

    const txn = await Mina.transaction(builderAccount, () => {
      zkApp.publishBounty(oldStatebounty.testCommit);
    });
    await txn.prove();
    await txn.sign([builderKey]).send();

    let newTestCommitState = Poseidon.hash([testHash]);

    let newStatebounty = new Bounty({
      testCommit: newTestCommitState,
      solutionCommit: emptyHash,
      computationCommit: emptyHash,
      isBountyOpen: Bool(true), // modified from function
      isVerified: Bool(false),
    });
    
    expect(zkApp.testCommmit.get()).toEqual(newStatebounty.testCommit);
    expect(zkApp.solutionCommit.get()).toEqual(newStatebounty.solutionCommit);
    expect(zkApp.computationCommit.get()).toEqual(newStatebounty.computationCommit);
    expect(zkApp.isBountyOpen.get()).toEqual(newStatebounty.isBountyOpen);
    expect(zkApp.isVerified.get()).toEqual(newStatebounty.isVerified);
  });

  it('HUNTER commits to a viable code solution', async () => {

    let soluionHash = Poseidon.hash(stringToFields('This is a solution'));
    let irrelevantBool = Bool(false);
    
    let oldStatebounty = new Bounty({
      testCommit: emptyHash,
      solutionCommit: soluionHash, // input
      computationCommit: emptyHash,
      isBountyOpen: irrelevantBool,
      isVerified: irrelevantBool,
    });

    const txn = await Mina.transaction(hunterAccount, () => {
      zkApp.commitSolution(oldStatebounty.solutionCommit);
    });
    await txn.prove();
    await txn.sign([hunterKey]).send();

    let testHash = Poseidon.hash(stringToFields('This is a test')); // private to builder atm.

    let newSolutionCommitState = Poseidon.hash([soluionHash]);

    let newStatebounty = new Bounty({
      testCommit: Poseidon.hash([testHash]),
      solutionCommit: newSolutionCommitState,
      computationCommit: emptyHash,
      isBountyOpen: Bool(false), // modified from function
      isVerified: Bool(false),
    });

    // can't check for testCommit because unit test is still private here.
    expect(zkApp.testCommmit.get()).toEqual(newStatebounty.testCommit);
    expect(zkApp.solutionCommit.get()).toEqual(newStatebounty.solutionCommit);
    expect(zkApp.computationCommit.get()).toEqual(newStatebounty.computationCommit);
    expect(zkApp.isBountyOpen.get()).toEqual(newStatebounty.isBountyOpen);
    expect(zkApp.isVerified.get()).toEqual(newStatebounty.isVerified);

  });

  it('HUNTER computes unit test with code solution and commits to result (after waiting period)', async () => {

    //  note: these are all currently dummy values (if it wasn't already obvious). ---------

    let testHash = Poseidon.hash(stringToFields('This is a test')); // REVEALED to hunter
    let soluionHash = Poseidon.hash(stringToFields('This is a solution')); // private to the hunter
    let computeHash = Poseidon.hash(stringToFields('The solution provided has passed the unit test')); // computed and private to the hunter

    // since we assume the unit test + code solution pairing has passed.
    let result = Bool(true);

    // dummy values end. -------------------------------------------------------------------

    let irrelevantBool = Bool(false);

    let oldStatebounty = new Bounty({
      testCommit: testHash, // input
      solutionCommit: soluionHash, // input
      computationCommit: computeHash, // input
      isBountyOpen: irrelevantBool,
      isVerified: irrelevantBool,
    });

    const txn = await Mina.transaction(hunterAccount, () => {
      zkApp.computeSolution(oldStatebounty.testCommit, oldStatebounty.solutionCommit, oldStatebounty.computationCommit, result);
    });
    await txn.prove();
    await txn.sign([hunterKey]).send();

    let newStatebounty = new Bounty({
      testCommit: Poseidon.hash([testHash]),
      solutionCommit: Poseidon.hash([soluionHash]),
      computationCommit: Poseidon.hash([computeHash]), // modified from function
      isBountyOpen: Bool(false), 
      isVerified: Bool(false),
    });

    expect(zkApp.testCommmit.get()).toEqual(newStatebounty.testCommit);
    expect(zkApp.solutionCommit.get()).toEqual(newStatebounty.solutionCommit);
    expect(zkApp.computationCommit.get()).toEqual(newStatebounty.computationCommit);
    expect(zkApp.isBountyOpen.get()).toEqual(newStatebounty.isBountyOpen);
    expect(zkApp.isVerified.get()).toEqual(newStatebounty.isVerified);
  });

  // This last proof naively verifies the correct computation
  // HUNTER redeems the token bounty for providing a correct code solution
  it('VERIFIER runs unit test with code solution to verify a passsing result', async () => {

    //  note: these are all currently dummy values (if it wasn't already obvious). ---------
    let testHash = Poseidon.hash(stringToFields('This is a test')); // REVEALED to hunter
    let soluionHash = Poseidon.hash(stringToFields('This is a solution')); // REVEALED to the hunter
    let computeHash = Poseidon.hash(stringToFields('The solution provided has passed the unit test')); // COMPUTED by verifier

    // since we assume the unit test + code solution pairing has passed.
    let result = Bool(true);
    // dummy values end. -------------------------------------------------------------------


    let irrelevantBool = Bool(false);

    let oldStatebounty = new Bounty({
      testCommit: testHash, // input
      solutionCommit: soluionHash, // input
      computationCommit: computeHash, // input
      isBountyOpen: irrelevantBool,
      isVerified: irrelevantBool,
    });

    const txn = await Mina.transaction(verifierAccount, () => {
      zkApp.verifySolution(oldStatebounty.testCommit, oldStatebounty.solutionCommit, oldStatebounty.computationCommit, result);
    });
    await txn.prove();
    await txn.sign([verifierKey]).send();

    let newStatebounty = new Bounty({
      testCommit: Poseidon.hash([testHash]),
      solutionCommit: Poseidon.hash([soluionHash]),
      computationCommit: Poseidon.hash([computeHash]),
      isBountyOpen: Bool(false), 
      isVerified: Bool(true), // modified from function
    });

    expect(zkApp.testCommmit.get()).toEqual(newStatebounty.testCommit);
    expect(zkApp.solutionCommit.get()).toEqual(newStatebounty.solutionCommit);
    expect(zkApp.computationCommit.get()).toEqual(newStatebounty.computationCommit);
    expect(zkApp.isBountyOpen.get()).toEqual(newStatebounty.isBountyOpen);
    expect(zkApp.isVerified.get()).toEqual(newStatebounty.isVerified);
  });

});