import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool } from 'o1js';

let proofsEnabled = true;

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
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Core(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Core` smart contract', async () => {
    await localDeploy();

    // let rawTestString = "This is a test";
    // let testFields = stringToFields(rawTestString);
    // let testHash = Poseidon.hash(testFields)

    expect(zkApp.testCommmit.get()).toEqual(Field(0));
    expect(zkApp.solutionCommit.get()).toEqual(Field(0));
    expect(zkApp.isBountyOpen.get()).toEqual(Bool(false));
    expect(zkApp.isVerified.get()).toEqual(Bool(false));

  });

});
