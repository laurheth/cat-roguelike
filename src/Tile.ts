
interface Neighbours {
    [key:string]:Tile;
}

type Step = number[];

/**
 * Slightly esoteric tile definition, but I think it might be fun.
 */
export default class Tile {
    private neighbours:Neighbours;
    public content:any;
    constructor(neighours:Neighbours,content:any) {
        this.neighbours = neighours;
        this.content = content;
    }

    public getNeighbour(step:Step):Tile|undefined {
        return this.neighbours[this.toKey(step)];
    }

    private toKey(step:Step):string {
        return step.map(x=>x.toString()).join(',');
    }

    public addNeighbour(step:Step, tile:Tile):boolean {
        const key = this.toKey(step);
        if(key in this.neighbours) {
            return false;
        } else {
            this.neighbours[key] = tile;
            return true;
        }
    }
}
