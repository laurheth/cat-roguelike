import Tile from './Tile';
import { Appearance } from './commonInterfaces';

export interface CritterParams {
    startTile:Tile;
    appearance:Appearance;
    onDamage?:(attacker:Critter)=>void;
    onDie?:()=>void;
}

/** Anything that moves around and does stuff */
export default class Critter {
    protected currentTile:Tile;
    protected _appearance:Appearance;
    protected onDamage?:(attacker:Critter)=>void;
    protected onDie?:()=>void;
    constructor(params:CritterParams) {
        const {
            startTile,
            appearance,
            onDamage=(attacker:Critter)=>{},
            onDie=()=>{},
            ...rest
        } = params;

        this.currentTile = startTile;
        this.currentTile.enterTile(this);
        this._appearance = appearance;
        this.onDamage = onDamage;
        this.onDie = onDie;
    }

    get appearance():Appearance {
        return this._appearance;
    }

    public step(dx:-1|0|1, dy:-1|0|1):boolean {
        const step:number[] = [dx,dy];
        const moveTo = this.currentTile.getNeighbour(step);
        if (moveTo) {
            const result = moveTo.enterTile(this);
            if (result instanceof Critter) {
                // interaction of some sort
                return true;
            } else if (result) {
                // Success, new tile contains us. Leave old tile
                this.currentTile.exitTile();
                // Update our position
                this.currentTile = moveTo;
                return true;
            }
        }
        return false;
    }

    /** Stub. */
    public act() {}
}