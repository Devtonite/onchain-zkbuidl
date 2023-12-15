import { Field, SmartContract, state, State, method, Bool, Poseidon } from 'o1js';
import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';

export class Core extends SmartContract {
  @state(Field) testCommmit = State<Field>();
  @state(Bool) isBountyOpen = State<Bool>();
  
  @state(Field) solutionCommit = State<Field>();
  @state(Bool) isVerified = State<Bool>();

  init() {
    super.init();
    this.testCommmit.set(Field(0));
    this.solutionCommit.set(Field(0));
    this.isBountyOpen.set(Bool(false));
    this.isVerified.set(Bool(false));
  }

  // method to start a new bounty
  @method publishBounty(testHash: Field) {
    this.testCommmit.requireEquals(Field(0));
    this.solutionCommit.requireEquals(Field(0));
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));

    let emptyTest = this.testCommmit.get();
    testHash.assertNotEquals(emptyTest)
    
    this.testCommmit.set(testHash);
  }
}
