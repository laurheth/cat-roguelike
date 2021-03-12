import Tile from './Tile';
import Player from './Player';
import Game from './Game';
import { Appearance } from './commonInterfaces';

export interface CritterParams {
    startTile:Tile;
    appearance:Appearance;
    onInteract?:(player:Player, game:Game)=>void;
}

/** Anything that moves around and does stuff */
export default class Critter {
    protected currentTile:Tile;
    protected _appearance:Appearance;
    private lookLeft:boolean;
    protected alive:boolean;
    private onInteract:((player:Player,game:Game)=>void)|undefined;
    constructor(params:CritterParams) {
        const {
            startTile,
            appearance,
            onInteract,
            ...rest
        } = params;

        const possibleTile = startTile.findEmptyNeigbour((tile:Tile)=>!tile.critter);
        if (possibleTile) {
            this.currentTile = possibleTile;
        } else {
            throw new Error("No available location.")
        }
        this.currentTile.enterTile(this);
        this._appearance = appearance;
        this.lookLeft=false;
        this.alive=true;
        this.onInteract = onInteract;
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

    public step(dx:number, dy:number):boolean|Critter {
        const step:number[] = [dx,dy];
        let moveSuccess:boolean|Critter = false;
        const moveTo = this.currentTile.getNeighbour(step);
        if (moveTo) {
            const result = moveTo.enterTile(this);
            if (result instanceof Critter) {
                // interaction of some sort
                moveSuccess = result;
            } else if (result) {
                // Success, new tile contains us. Leave old tile
                this.currentTile.exitTile();
                // Update our position
                this.currentTile = moveTo;
                moveSuccess = true;
            }
        }
        if(moveSuccess) {
            if (dx < 0) {
                this.lookLeft=true;
            } else if (dx > 0) {
                this.lookLeft=false;
            }
        }
        return moveSuccess;
    }

    public interact(player:Player, game:Game) {
        if(this.onInteract) {
            this.onInteract(player, game);
        }
    }

    /** Stubs. */
    public act() {}
    attackMe(damage:number) {
        return 0;
    }
    public die() {
        this.currentTile.exitTile();
        this.alive=false;
    }
    public goTo(tile:Tile) {
        if(tile.enterTile(this) === true) {
            this.currentTile = tile;
            return true;
        }
        return false;
    }
}