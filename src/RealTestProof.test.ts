import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, VerificationKey, SelfProof } from 'o1js';
import { Bounty, TestProof } from './BountyType';
import * as fs from 'fs';
import { join } from 'path';

let proofsEnabled = true;

describe('RealTestProof', () => {
  let keyForVerify: VerificationKey,
  baseProof: SelfProof<Field, Field>,
  // recursiveProof: SelfProof<Field, Field>,
  testInFields: Field[]
  ;

  beforeAll(async () => {
    const { verificationKey } = await TestProof.compile();
    keyForVerify = verificationKey;
    
    let string = fs.readFileSync('./src/exampleCoreTest.txt', 'utf-8');
    testInFields = stringToFields(string);

  });

  it('generates and TestProof ZKProgram', async () => {
    console.log(keyForVerify.hash);
  });

  it('prove base case with Field(0)', async () => {
    let publicInput = Poseidon.hash([Field(0)]);
    baseProof = await TestProof.initEmptyTest(publicInput, Field(0));

    // console.log(baseProof.toJSON());
    });

  // working but WAY TO COMPUTATIONALY EXPENSIVE. Todo: shorten the # of proofs
  it('prove recursive case with array of testFields', async () => {
      let currentProof = baseProof;
      let publicInput = baseProof.publicOutput;
      
      console.log(`Number of Fields from code: ${testInFields.length}`);
      
      let value = 0;
      
      for (let singleField of testInFields) {
          currentProof = await TestProof.recurseTest(publicInput, singleField, currentProof);
          publicInput = currentProof.publicOutput;
          value += 1;
          // console.log(currentProof);
          console.log(`Proof number: ${value}`);
      }
  });

});