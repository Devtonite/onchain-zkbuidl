import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, VerificationKey, SelfProof } from 'o1js';
import { Bounty, TestProof } from './BountyType';

let proofsEnabled = true;

describe('TestProof', () => {
  let keyForVerify: VerificationKey,
  baseProof: SelfProof<Field, Field>,
  recursiveProof: SelfProof<Field, Field>
  ;

  beforeAll(async () => {
    const { verificationKey } = await TestProof.compile();
    keyForVerify = verificationKey;
  });

  it('generates and TestProof ZKProgram', async () => {
    console.log(keyForVerify.hash);
  });

  it('prove base case with Field(0)', async () => {
    let publicInput = Poseidon.hash([Field(0)]);
    baseProof = await TestProof.initEmptyTest(publicInput, Field(0));

    // console.log(baseProof.toJSON());
    });

  it('prove recursive case with a single testField', async () => {
      let currentProof = baseProof;
      let publicInput = baseProof.publicOutput;

      let testFields = stringToFields('This is a test');
      console.log(`Number of Fields from code: ${testFields.length}`);
      
      let value = 0;

      for (let singleField of testFields) {
          currentProof = await TestProof.recurseTest(publicInput, singleField, currentProof);
          publicInput = currentProof.publicOutput;
          value += 1;
          // console.log(currentProof);
          console.log(`Proof number: ${value}`);
      }
  });

  it('prove recursive case with array of testFields', async () => {
      let currentProof = baseProof;
      let publicInput = baseProof.publicOutput;
      
      let testFields = [Field(10), Field(20), Field(30)];
      console.log(`Number of Fields from code: ${testFields.length}`);
      
      let value = 0;
      
      for (let singleField of testFields) {
          currentProof = await TestProof.recurseTest(publicInput, singleField, currentProof);
          publicInput = currentProof.publicOutput;
          value += 1;
          // console.log(currentProof);
          console.log(`Proof number: ${value}`);
      }
  });


});