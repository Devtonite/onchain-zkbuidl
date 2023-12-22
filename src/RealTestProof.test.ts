import { bytesToFields, stringToFields } from 'o1js/dist/node/bindings/lib/encoding';
import { Core } from './Core';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, Bool, VerificationKey, SelfProof } from 'o1js';
import { Bounty, File2, TestProof, arrayFile2 } from './BountyType';
import * as fs from 'fs';
import { Blob } from 'buffer';

let proofsEnabled = true;

describe('RealTestProof', () => {
  let keyForVerify: VerificationKey,
  baseProof: SelfProof<Field, Field>,
  // recursiveProof: SelfProof<Field, Field>,
  stringInFields: Field[],
  byteInFields: Field[]
  ;

  beforeAll(async () => {
    const { verificationKey } = await TestProof.compile();
    keyForVerify = verificationKey;
    
    // let string = fs.readFileSync('./src/exampleCoreTest.txt', 'utf-8');
    let string = 'TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest';
    let stringBlob = new Blob([string], {type: 'utf-8'});
    stringInFields = stringToFields(string);

    let byteArray = await stringBlob.arrayBuffer();
    let uint8ByteArray = new Uint8Array(byteArray);
    byteInFields  = bytesToFields(uint8ByteArray);
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
      
      console.log(`Number of Fields from string: ${stringInFields.length}`);
      console.log(`Number of Fields from bytes: ${byteInFields.length}`);

      
      let value = 0;

      // build a File2 struct from a Field[]
      // let oneStruct = new File2({
      //   a1: stringInFields[0],
      //   a2: stringInFields[1]
      // })

      let files = arrayFile2(stringInFields);

      for (let singleFile of files) {
        currentProof = await TestProof.recurseTest(publicInput, singleFile, currentProof);
        publicInput = currentProof.publicOutput;
        value += 1;
        console.log(`Proof number: ${value}`);
      }


      // for (let singleField of testInFields) {
      //     currentProof = await TestProof.recurseTest(publicInput, singleField, currentProof);
      //     publicInput = currentProof.publicOutput;
      //     value += 1;
      //     // console.log(currentProof);
      //     console.log(`Proof number: ${value}`);
      // }
  });

});