import { Bool, Field, Poseidon, SelfProof, Struct, ZkProgram } from "o1js";

export class Bounty extends Struct({
    testCommit: Field,
    solutionCommit: Field,
    hashOfComputation: Field,
    isBountyOpen: Bool,
    isVerified: Bool,
}){}

export class FileInFields extends Struct({
    a1: Field,
    a2: Field,
}){
    static toArray(someFile: FileInFields){
        return [someFile.a1, someFile.a2];
    }
}

export function arrayToFileFields(fields: Field[]): FileInFields[] {
    let number = fields.length;
    let array = [];

    for (let i = 0; i < number; i += 2) {
        let oneStruct: FileInFields;
        if (i + 1 == number) {
            oneStruct = new FileInFields({
                a1: fields[i],
                a2: Field(0),
              })
        } else {
            oneStruct = new FileInFields({
                a1: fields[i],
                a2: fields[i + 1]
              })
        }
        array.push(oneStruct)
    }
    return array;
}

export const TestProof = ZkProgram({
    name: "generating-test-proof",
    publicInput: Field,
    publicOutput: Field,

    methods: {
        initEmptyTest: {
            privateInputs: [Field],

            method(publicInput: Field, emptyString: Field): Field {
                publicInput.assertEquals(Poseidon.hash([emptyString]));

                let output = Poseidon.hash([publicInput, emptyString]);
                return output; // the first publicInput for recursion
            }
        },

        recurseTest: {
            privateInputs: [FileInFields, SelfProof],

            method(publicPrev: Field, fieldRemFromArray: FileInFields, prevProof: SelfProof<Field, Field>): Field {
                prevProof.verify();
                publicPrev.assertEquals(prevProof.publicOutput);
                let newOutput = Poseidon.hash([publicPrev, fieldRemFromArray.a1, fieldRemFromArray.a2]);
                return newOutput;
            }
        },
    }
});