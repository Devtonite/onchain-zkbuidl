import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64, PrivateKey, AccountUpdate } from 'o1js';
import { BountyQuest } from './builder/BuildQuest';
import { BountyKey } from './hunter/CommitKey';

export class Core extends SmartContract {

  @state(BountyQuest) openBountyQuest = State<BountyQuest>();
  @state(BountyKey) merkledBountyKeys = State<BountyKey>();

  init() {
    super.init();
  }

  @method publishBountyQuest(quest: BountyQuest) {    
    let allAccountUpdates = AccountUpdate.create(this.sender)

    let balance = allAccountUpdates.account.balance.getAndRequireEquals();
    let questTokenReward = quest.tokenRewardAmount;
    balance.assertGreaterThanOrEqual(questTokenReward)
    allAccountUpdates.requireSignature();
    allAccountUpdates.send({to: this.address, amount: questTokenReward})

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
  }

}