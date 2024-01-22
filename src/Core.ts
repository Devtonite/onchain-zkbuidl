import { Field, SmartContract, state, State, method, Bool, Poseidon, UInt32, UInt64 } from 'o1js';
import { stringToFields } from 'o1js/dist/node/bindings/lib/encoding';

let emptyHash = Poseidon.hash(stringToFields(''));
const MILLISECONDS_PER_HOUR: UInt64 = UInt64.from(1000*60*60);

export class Core extends SmartContract {

  @state(Field) openBountyQuest = State<Field>();
  @state(Field) merkledBountyKeys = State<Field>();

  init() {
    super.init();
    this.openBountyQuest.set(Field(0));
    this.merkledBountyKeys.set(Field(0));

  }

  @method publishBountyQuest(test: Field) {
  }

  @method commitBountyKey(solution: Field) {
  }
  
  @method rewardWinner(test: Field, solution: Field, computation: Field, result: Bool) {
  }

}