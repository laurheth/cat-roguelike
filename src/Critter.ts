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
    private lookLeft:boolean;
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
        this.lookLeft=false;
    }

    get appearance():Appearance {
        return this.getAppearance();
    }

    protected getAppearance():Appearance {
        if (this.lookLeft) {
            return {
                content:this._appearance.content,
                classList:['left',...this._appearance.classList]
            }
        } else {
            return this._appearance;
        }
    }

    public step(dx:number, dy:number):boolean {
        const step:number[] = [dx,dy];
        let moveSuccess = false;
        const moveTo = this.currentTile.getNeighbour(step);
        if (moveTo) {
            const result = moveTo.enterTile(this);
            if (result instanceof Critter) {
                // interaction of some sort
                moveSuccess = true;
            } else if (result) {
                // Success, new tile contains us. Leave old tile
                this.currentTile.exitTile();
                // Update our position
                this.currentTile = moveTo;
                moveSuccess = true;
            }
        }
        if(moveSuccess) {
            if (dx < 0 || dy < 0) {
                this.lookLeft=true;
            } else {
                this.lookLeft=false;
            }
        }
        return moveSuccess;
    }

    /** Stub. */
    public act() {}
}