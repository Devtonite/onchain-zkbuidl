import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64, PrivateKey, AccountUpdate } from 'o1js';
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
    let allAccountUpdates = AccountUpdate.create(this.sender)

    let balance = allAccountUpdates.account.balance.getAndRequireEquals();
    let questTokenReward = quest.tokenRewardAmount;
    balance.assertGreaterThanOrEqual(questTokenReward)
    allAccountUpdates.send({to: this.address, amount: questTokenReward})
    allAccountUpdates.requireSignature();

    let duration = quest.bountyDuration;
    let now = this.network.timestamp.getAndRequireEquals();
    let bountyOpenTill = now.add(duration);

    let timedQuest = new BountyQuest({
      builderID: quest.builderID,
      testHash: quest.testHash,
      tokenRewardAmount: quest.tokenRewardAmount,
      bountyDuration: bountyOpenTill
    })

    this.openBountyQuest.set(timedQuest);

  }

  @method commitBountyKey(solution: BountyKey) {
    let openBounty = this.openBountyQuest.getAndRequireEquals();
    let now = this.network.timestamp.getAndRequireEquals();
    now.assertLessThanOrEqual(openBounty.bountyDuration);
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