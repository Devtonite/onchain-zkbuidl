import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64 } from 'o1js';
import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';

let emptyHash = Poseidon.hash(stringToFields(''));

export class Core extends SmartContract {
  @state(Field) testCommit = State<Field>();
  @state(Field) solutionCommit = State<Field>();
  @state(Field) computationCommit = State<Field>();
  @state(Bool) isBountyOpen = State<Bool>();
  @state(UInt64) bountyOpenTill = State<UInt64>();
  @state(Bool) isVerified = State<Bool>();

  init() {
    super.init();
    this.testCommit.set(emptyHash);
    this.solutionCommit.set(emptyHash);
    this.computationCommit.set(emptyHash);
    this.isBountyOpen.set(Bool(false));
    this.bountyOpenTill.set(UInt64.from(0));
    this.isVerified.set(Bool(false));

  }

  // method to commit to a unit test 
  @method publishBounty(test: Field, durationINmilliSeconds: UInt64) {
    this.testCommit.requireEquals(emptyHash);
    this.solutionCommit.requireEquals(emptyHash);
    this.computationCommit.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(false));
    this.bountyOpenTill.requireEquals(UInt64.from(0));
    this.isVerified.requireEquals(Bool(false));

    let emptyTest = this.testCommit.getAndRequireEquals();
    test.assertNotEquals(emptyTest);

    let hashOfTest = Poseidon.hash([test]);
    this.testCommit.set(hashOfTest);
    let currentTime = this.network.timestamp.getAndRequireEquals();
    let timeTillBountyLocks = currentTime.add(durationINmilliSeconds);
    this.bountyOpenTill.set(timeTillBountyLocks);
    this.isBountyOpen.set(Bool(true));
  }

  // method to commit to a solution for an open bounty
  @method commitSolution(solution: Field) {
    this.testCommit.getAndRequireEquals();
    this.solutionCommit.requireEquals(emptyHash);
    this.computationCommit.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(true));
    this.isVerified.requireEquals(Bool(false));

    let timeTillBountyLocks = this.bountyOpenTill.getAndRequireEquals();
    let submissionTime = this.network.timestamp.getAndRequireEquals();
    submissionTime.assertLessThanOrEqual(timeTillBountyLocks);

    let emptySolution = this.solutionCommit.getAndRequireEquals();
    solution.assertNotEquals(emptySolution);

    let hashOfSolution = Poseidon.hash([solution]);
    this.solutionCommit.set(hashOfSolution);
    this.isBountyOpen.set(Bool(false));
    this.bountyOpenTill.set(UInt64.from(0));
  }

  // method to compute the solution with the revealed unit test, and commit that computation on chain
  @method computeSolution(test: Field, solution: Field, computation: Field, result: Bool) {
    let currTest = this.testCommit.getAndRequireEquals();
    currTest.assertEquals(Poseidon.hash([test]));
    let currSolution = this.solutionCommit.getAndRequireEquals();
    currSolution.assertEquals(Poseidon.hash([solution]));
    
    this.computationCommit.requireEquals(emptyHash);
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));
    
    let hashOfCompute = Poseidon.hash([computation]);
    this.computationCommit.set(hashOfCompute);
    // currently just a bool to indicate whether the computation passed or failed,
    // todo: use the outputs of a test and hash the values to determine the result.
    result.assertEquals(Bool(true));
  }
  
  // method to verify the committed computation of the committed solution against the committed unit test for 
  @method verifySolution(test: Field, solution: Field, computation: Field, result: Bool) {
    let currTest = this.testCommit.getAndRequireEquals();
    currTest.assertEquals(Poseidon.hash([test]));
    let currSolution = this.solutionCommit.getAndRequireEquals();
    currSolution.assertEquals(Poseidon.hash([solution]));
    let currCompute = this.computationCommit.getAndRequireEquals();
    currCompute.assertEquals(Poseidon.hash([computation]));
    this.isBountyOpen.requireEquals(Bool(false));
    this.isVerified.requireEquals(Bool(false));

    result.assertEquals(Bool(true));
    this.isVerified.set(Bool(true));
  }

}