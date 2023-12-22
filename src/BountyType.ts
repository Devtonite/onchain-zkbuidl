import { Bool, Field, Poseidon, SelfProof, Struct, ZkProgram } from "o1js";

export class Bounty extends Struct({
    testCommit: Field,
    solutionCommit: Field,
    hashOfComputation: Field,
    isBountyOpen: Bool,
    isVerified: Bool,
}){}

export class File8 extends Struct({
    a1: Field,
    a2: Field,
    a3: Field,
    a4: Field,
    a5: Field,
    a6: Field,
    a7: Field,
    a8: Field,
}){
    static toArray(someFile: File8) {
        return [someFile.a1, someFile.a2, someFile.a3, someFile.a4, someFile.a5, someFile.a6, someFile.a7, someFile.a8];
    }
}

export function arrayFile8(fields: Field[]): File8[] {
    const fieldsPerSection = 8;
    let length = fields.length; 
    let numSets = Math.floor(length / fieldsPerSection);
    // for now, truncate the extra fields
    let rem = length % fieldsPerSection;

    let array = [];
    for (let i = 0; i < numSets; i++) {
        let oneStruct: File8;

        oneStruct = new File8({
            a1: fields[fieldsPerSection*i],
            a2: fields[fieldsPerSection*i+1],
            a3: fields[fieldsPerSection*i+2],
            a4: fields[fieldsPerSection*i+3],
            a5: fields[fieldsPerSection*i+4],
            a6: fields[fieldsPerSection*i+5],
            a7: fields[fieldsPerSection*i+6],
            a8: fields[fieldsPerSection*i+7],
            })
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
            privateInputs: [File8, SelfProof],

            method(publicPrev: Field, fieldRemFromArray: File8, prevProof: SelfProof<Field, Field>): Field {
                prevProof.verify();
                publicPrev.assertEquals(prevProof.publicOutput);
                let array = File8.toArray(fieldRemFromArray);
                let arrayHash = Poseidon.hash(array);
                let newOutput = Poseidon.hash([publicPrev, arrayHash]);
                return newOutput;
            }
        },
    }
});