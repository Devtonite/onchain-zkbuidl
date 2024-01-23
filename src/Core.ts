import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64, PrivateKey, AccountUpdate } from 'o1js';
import { BountyQuest } from './builder/BuildQuest';

export class Core extends SmartContract {

  @state(BountyQuest) openBountyQuest = State<BountyQuest>();
  @state(Field) merkledBountyKeys = State<Field>();

  init() {
    super.init();
    this.merkledBountyKeys.set(Field(0));

  }

  @method publishBountyQuest(quest: BountyQuest) {    
    let allAccountUpdates = AccountUpdate.create(this.sender)
    let balance = allAccountUpdates.account.balance.getAndRequireEquals();
    let questTokenReward = quest.tokenRewardAmount;
    balance.assertGreaterThanOrEqual(questTokenReward)
    allAccountUpdates.send({to: this.address, amount: questTokenReward})
    allAccountUpdates.requireSignature();
    this.openBountyQuest.set(quest);

  }

  @method commitBountyKey(solution: Field) {
  }
  
  @method rewardWinner(test: Field, solution: Field, computation: Field, result: Bool) {
  }

}