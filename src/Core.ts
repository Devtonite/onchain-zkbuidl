import { Field, SmartContract, state, State, method, Bool, Poseidon, Provable } from 'o1js';
import { Bounty } from './BountyType';
import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';

let emptyHash = Poseidon.hash(stringToFields(''));

export class Core extends SmartContract {
  @state(Field) testCommmit = State<Field>();
  @state(Field) solutionCommit = State<Field>();
  @state(Field) hashOfComputation = State<Field>();
  @state(Bool) isBountyOpen = State<Bool>();
  @state(Bool) isVerified = State<Bool>();

  init() {
    super.init();
    this.testCommmit.set(emptyHash);
    this.solutionCommit.set(emptyHash);
    this.hashOfComputation.set(emptyHash);
    this.isBountyOpen.set(Bool(false));
    this.isVerified.set(Bool(false));

  }

  // method to commit to a unit test
  @method publishBounty(test: Field) {
    this.testCommmit.requireEquals(emptyHash);
    this.solutionCommit.requireEquals(emptyHash);
    this.hashOfComputation.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));

    let emptyTest = this.testCommmit.getAndRequireEquals();
    test.assertNotEquals(emptyTest);

    this.testCommmit.set(test);
    this.isBountyOpen.set(Bool(true));
  }

  // method to commit to a solution for an open bounty
  @method commitSolution(solution: Field) {
    this.testCommmit.getAndRequireEquals();
    this.solutionCommit.requireEquals(emptyHash);
    this.hashOfComputation.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(true));
    this.isVerified.requireEquals(Bool(false));

    let emptySolution = this.solutionCommit.getAndRequireEquals();
    solution.assertNotEquals(emptySolution);

    this.solutionCommit.set(solution);
    this.isBountyOpen.set(Bool(false));
  }

  // method to compute the solution with the revealed unit test, and commit that computation on chain
  @method computeSolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    
    result.assertEquals(Bool(true));
    this.hashOfComputation.set(hashOfComputation);
  }
  
  // method to verify the commited computation of the commited solution against the committed unit test for 
  @method verifySolution(unitTest: Field, codeSolution: Field, hashOfComputation: Field, result: Bool) {
    this.testCommmit.requireEquals(unitTest);
    this.solutionCommit.requireEquals(codeSolution);
    this.hashOfComputation.requireEquals(hashOfComputation);
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    
    result.assertEquals(Bool(true));
    this.isVerified.set(Bool(true));
  }

}