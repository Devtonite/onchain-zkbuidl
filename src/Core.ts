import { Field, SmartContract, state, State, method, Bool, Poseidon, Provable } from 'o1js';
import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';

export class Core extends SmartContract {
  @state(Field) testCommmit = State<Field>();
  @state(Bool) isBountyOpen = State<Bool>();
  
  @state(Field) solutionCommit = State<Field>();
  
  // @state(Bool) builderResult = State<Bool>();
  // @state(Bool) hunterResult = State<Bool>();
  // @state(Bool) verifierResult = State<Bool>();

  @state(Field) hashOfComputation = State<Field>();
  @state(Bool) isVerified = State<Bool>();

  init() {
    super.init();
    this.testCommmit.set(Field(0));
    this.solutionCommit.set(Field(0));
    this.isBountyOpen.set(Bool(false));
    this.hashOfComputation.set(Field(0));
    this.isVerified.set(Bool(false));
  }

  // method to start a new bounty
  @method publishBounty(testHash: Field) {
    this.testCommmit.requireEquals(Field(0));
    this.solutionCommit.requireEquals(Field(0));
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));

    let emptyTest = this.testCommmit.get();
    testHash.assertNotEquals(emptyTest);

    this.testCommmit.set(testHash);
    this.isBountyOpen.set(Bool(true));

  }

  // method to commit to a solution hash for open bounty
  @method commitSolution(solutionHash: Field) {
    this.isBountyOpen.requireEquals(Bool(true));
    this.isVerified.requireEquals(Bool(false));
    let emptySolution = this.solutionCommit.getAndRequireEquals();

    solutionHash.assertNotEquals(emptySolution);

    this.solutionCommit.set(solutionHash);
    this.isBountyOpen.set(Bool(false));
  }

  // method to compute the solution with the revealed unit test and commit that solution on chain
  @method computeSolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.requireEquals(Field(0));

    let resultHash = Poseidon.hash([this.testCommmit.get(), this.solutionCommit.get()]);
    resultHash.assertEquals(Poseidon.hash([unitTest, codeSolution]));

    result.assertEquals(Bool(true));

    this.hashOfComputation.set(hashOfComputation);
  }
  
  // method to commit to a solution hash for open bounty
  @method verifySolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.get().assertNotEquals(Field(0));
    
    let resultHash = Poseidon.hash([this.testCommmit.get(), this.solutionCommit.get(), this.hashOfComputation.get()]);
    resultHash.assertEquals(Poseidon.hash([unitTest, codeSolution, hashOfComputation]))
    result.assertEquals(Bool(true));
    
    this.isVerified.set(Bool(true));
  }

}
