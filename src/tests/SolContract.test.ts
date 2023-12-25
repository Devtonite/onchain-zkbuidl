import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from '../Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool } from 'o1js';
import { Bounty } from '../BountyType';

export type user = {
    privateKey: PrivateKey,
    publicKey: PublicKey
}

describe('Solidity', () => {
    let deployer: user, 
        builder: user, 
        hunter: user, 
        verifier: user;
    let zkAppAddress: PublicKey,
        zkAppPrivateKey: PrivateKey,
        zkApp: Core;

    beforeAll(async () => {
        await Core.compile();
        const Local = Mina.LocalBlockchain();
        Mina.setActiveInstance(Local);

        deployer = Local.testAccounts[0];
        builder = Local.testAccounts[1];
        hunter = Local.testAccounts[2];
        verifier = Local.testAccounts[3];

        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
        zkApp = new Core(zkAppAddress);
    })

    it('deployer deploys zkApp smart contract', async () => {
        const txn = await Mina.transaction(deployer.publicKey, () => {
            AccountUpdate.fundNewAccount(deployer.publicKey);
            zkApp.deploy();
          });
          await txn.prove();
          await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
    });
});