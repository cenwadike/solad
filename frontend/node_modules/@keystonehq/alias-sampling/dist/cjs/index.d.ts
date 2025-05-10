type RNGFunction = () => number;
type AliasData = {
    prob: number[];
    alias: number[];
};
declare const next: (aliasData: AliasData, outcomes: any[], rng: RNGFunction, numOfSamples?: number) => any | any[];
declare const sample: (probabilities: number[], outcomes?: any[], rng?: RNGFunction) => {
    next: (numOfSamples?: number) => any | any[];
};
export default sample;
