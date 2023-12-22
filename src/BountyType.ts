import { Bool, Field, Poseidon, SelfProof, Struct, ZkProgram } from "o1js";

export class Bounty extends Struct({
    testCommit: Field,
    solutionCommit: Field,
    hashOfComputation: Field,
    isBountyOpen: Bool,
    isVerified: Bool,
}){}

export class File2 extends Struct({
    a1: Field,
    a2: Field,
}){
    static toArray(someFile: File2){
        return [someFile.a1, someFile.a2];
    }
}

export function arrayFile2(fields: Field[]): File2[] {
    let number = fields.length;
    let array = [];

    for (let i = 0; i < number; i += 2) {
        let oneStruct: File2;
        if (i + 1 == number) {
            oneStruct = new File2({
                a1: fields[i],
                a2: Field(0),
              })
        } else {
            oneStruct = new File2({
                a1: fields[i],
                a2: fields[i + 1]
              })
        }
        array.push(oneStruct)
    }
    return array;
}

export class File3 extends Struct({
    a1: Field,
    a2: Field,
    a3: Field
}){
    static toArray(someFile: File3) {
        return [someFile.a1, someFile.a2, someFile.a3];
    }
    static buildFile(someArray: Field[]) {

    }
}

export function arrayFile3(fields: Field[]): File2[] {
    const fieldsPerSection = 3;
    let length = fields.length;
    let numSets = length / fieldsPerSection;
    // for now, truncate the extra fields
    let rem = length % fieldsPerSection;
    
    let array = [];

    for (let i = 0; i < numSets; i++) {
        let oneStruct: File2;

        oneStruct = new File3({
            a1: fields[fieldsPerSection*i],
            a2: fields[fieldsPerSection*i + 1],
            a3: fields[fieldsPerSection*i + 2]
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
            privateInputs: [File2, SelfProof],

            method(publicPrev: Field, fieldRemFromArray: File2, prevProof: SelfProof<Field, Field>): Field {
                prevProof.verify();
                publicPrev.assertEquals(prevProof.publicOutput);
                let array = File2.toArray(fieldRemFromArray);
                let arrayHash = Poseidon.hash(array);
                let newOutput = Poseidon.hash([publicPrev, arrayHash]);
                return newOutput;
            }
        },
    }
});