export function getSplitPoint(length: number) {
  if (length < 1) {
    console.error("Trying to split a tree with size < 1");
    return 0;
  }
  let b = 0;
  for (let i = 1; i < length; i <<= 1) {
    b++;
  }
  let k = 1 << (b - 1);
  if (k === length) {
    k >>= 1;
  }
  return k;
}

type HashFunction = (data: number[]) => number[];

export class Tree {
  private hashFn: HashFunction;
  private leavesHashes: number[][];

  constructor(hashFn: HashFunction) {
    this.hashFn = hashFn;
    this.leavesHashes = [];
  }

  push(data: number[]): void {
    this.leavesHashes.push(this.hashLeaf(data));
  }

  private hashLeaf(data: number[]): number[] {
    let nData: number[] = [];
    nData.push(0);
    nData.push(...data);

    let nId = data.slice(0, 29);
    let hl: number[] = [];
    hl.push(...nId);
    hl.push(...nId);
    let h = this.hashFn(nData);
    hl.push(...h);
    return hl;
  }

  private hashNode(left: number[], right: number[]): number[] {
    let nId = left.slice(0, 29);
    let nData: number[] = [];
    nData.push(1);
    nData.push(...left);
    nData.push(...right);

    let hn: number[] = [];
    hn.push(...nId);
    hn.push(...nId);
    let h = this.hashFn(nData);
    hn.push(...h);
    return hn;
  }

  getRoot(): number[] {
    return this._computeRoot(0, this.leavesHashes.length);
  }

  private _computeRoot(start: number, end: number): number[] {
    let l = end - start;
    if (l === 0) {
      return this.emptyRoot();
    } else if (l === 1) {
      return this.leavesHashes[0];
    } else {
      let sp = getSplitPoint(l);
      let left = this._computeRoot(start, start + sp);
      let right = this._computeRoot(start + sp, end);
      return this.hashNode(left, right);
    }
  }

  private emptyRoot(): number[] {
    let root: number[] = [];
    for (let i = 0; i < 29; i++) {
      root.push(0);
    }
    for (let i = 0; i < 29; i++) {
      root.push(0);
    }
    for (let i = 0; i < 32; i++) {
      root.push(0);
    }
    return root;
  }
}
