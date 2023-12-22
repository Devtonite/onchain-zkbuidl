import { bytesToFields, stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, VerificationKey, SelfProof } from 'o1js';
import { Bounty, TestProof, arrayFile3 } from './BountyType';
import * as fs from 'fs';
import { Blob } from 'buffer';

let proofsEnabled = true;

describe('RealTestProof', () => {
  let keyForVerify: VerificationKey,
  baseProof: SelfProof<Field, Field>,
  stringInFields: Field[];

  beforeAll(async () => {
    const { verificationKey } = await TestProof.compile();
    keyForVerify = verificationKey;
    
    let string = fs.readFileSync('./src/exampleTest.txt', 'utf-8');
    stringInFields = stringToFields(string);
  });

  it('generates and TestProof ZKProgram', async () => {
    console.log(keyForVerify.hash);
  });

  it('prove base case with Field(0)', async () => {
    let publicInput = Poseidon.hash([Field(0)]);
    baseProof = await TestProof.initEmptyTest(publicInput, Field(0));
    });

  // working but WAY TO COMPUTATIONALY EXPENSIVE. Todo: shorten the # of proofs
  it('prove recursive case with struct of 3 Fields', async () => {
      let currentProof = baseProof;
      let publicInput = baseProof.publicOutput;
      
      console.log(`Number of Fields from string: ${stringInFields.length}`);

      let value = 0;
      let files = arrayFile3(stringInFields);

      for (let singleFile of files) {
        currentProof = await TestProof.recurseTest(publicInput, singleFile, currentProof);
        publicInput = currentProof.publicOutput;
        value += 1;
        console.log(`Proving set: ${value}`);
      }
  });

});