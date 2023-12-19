import { Field, SmartContract, state, State, method, Bool, Poseidon, Provable } from 'o1js';

export class Core extends SmartContract {
  @state(Field) testCommmit = State<Field>();
  @state(Field) solutionCommit = State<Field>();
  @state(Field) hashOfComputation = State<Field>();
  @state(Bool) isBountyOpen = State<Bool>();
  @state(Bool) isVerified = State<Bool>();

  init() {
    super.init();
    this.testCommmit.set(Field(0));
    this.solutionCommit.set(Field(0));
    this.hashOfComputation.set(Field(0));
    this.isBountyOpen.set(Bool(false));
    this.isVerified.set(Bool(false));
  }

  // method to commit to a unit test
  @method publishBounty(testHash: Field) {
    this.testCommmit.requireEquals(Field(0));
    this.solutionCommit.requireEquals(Field(0));
    this.hashOfComputation.requireEquals(Field(0));
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));

    let emptyTest = this.testCommmit.getAndRequireEquals();
    testHash.assertNotEquals(emptyTest);

    this.testCommmit.set(testHash);
    this.isBountyOpen.set(Bool(true));

  }

  // method to commit to a solution for an open bounty
  @method commitSolution(solutionHash: Field) {
    this.solutionCommit.requireEquals(Field(0));
    this.hashOfComputation.requireEquals(Field(0));
    this.isBountyOpen.requireEquals(Bool(true));
    this.isVerified.requireEquals(Bool(false));

    let emptySolution = this.solutionCommit.getAndRequireEquals();
    solutionHash.assertNotEquals(emptySolution);

    this.solutionCommit.set(solutionHash);
    this.isBountyOpen.set(Bool(false));
  }

  // method to compute the solution with the revealed unit test, and commit that computation on chain
  @method computeSolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.requireEquals(Field(0));
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    
    let testAndSolHash = Poseidon.hash([this.testCommmit.getAndRequireEquals(), this.solutionCommit.getAndRequireEquals()]);
    testAndSolHash.assertEquals(Poseidon.hash([unitTest, codeSolution]));
    result.assertEquals(Bool(true));

    this.hashOfComputation.set(hashOfComputation);
  }
  
  // method to verify the commited computation of the commited solution against the committed unit test for 
  @method verifySolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.requireEquals(hashOfComputation);
    
    let testAndSolHash = Poseidon.hash([this.testCommmit.getAndRequireEquals(), this.solutionCommit.getAndRequireEquals()]);
    testAndSolHash.assertEquals(Poseidon.hash([unitTest, codeSolution]));
    result.assertEquals(Bool(true));

    this.isVerified.set(Bool(true));
  }

}