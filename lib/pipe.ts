// from https://dev.to/ascorbic/creating-a-typed-compose-function-in-typescript-3-351i
export const pipe = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => (value) => nextFn(prevFn(value)), fn1);
