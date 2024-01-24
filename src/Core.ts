import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64, PrivateKey, AccountUpdate, Provable } from 'o1js';
import { BountyQuest } from './builder/BuildQuest';
import { BountyKey } from './hunter/CommitKey';

export class Core extends SmartContract {

  @state(BountyQuest) openBountyQuest = State<BountyQuest>();
  @state(BountyKey) merkledBountyKeys = State<BountyKey>();
  // @state(Field) verifiableComputation = State<Field>();

  init() {
    super.init();
    // this.verifiableComputation.set(Field(0))
  }

  @method publishBountyQuest(quest: BountyQuest) {    
    this.openBountyQuest.getAndRequireEquals();

    let allAccountUpdates = AccountUpdate.create(this.sender)
    
    let now = this.network.timestamp.getAndRequireEquals();    
    quest.bountyDuration.assertGreaterThan(now);
    
    let balance = allAccountUpdates.account.balance.getAndRequireEquals();
    balance.assertGreaterThanOrEqual(quest.tokenRewardAmount)
    allAccountUpdates.send({to: this, amount: quest.tokenRewardAmount})
    allAccountUpdates.requireSignature();
    
    this.openBountyQuest.set(quest);
  }

  @method commitBountyKey(solution: BountyKey) {
    let openBounty = this.openBountyQuest.getAndRequireEquals();
    let now = this.network.timestamp.getAndRequireEquals();
    openBounty.bountyDuration.assertGreaterThanOrEqual(now);
    this.merkledBountyKeys.set(solution)

  }
  
  @method rewardWinner(test: Field, solution: Field, computation: Field, result: Bool) {
    let onStateQuest = this.openBountyQuest.getAndRequireEquals();
    onStateQuest.testHash.assertEquals(Poseidon.hash([test]));
    let onStateKey = this.merkledBountyKeys.getAndRequireEquals();
    onStateKey.solutionHash.assertEquals(Poseidon.hash([solution]));
    // trust assumption: if caller of this function received the test and solution, their computation and result is honest and accurate.
    result.assertEquals(Bool(true));

    // this.verifiableComputation.set(solution);
    this.send({to: onStateKey.hunterID, amount: onStateQuest.tokenRewardAmount})
  }

}