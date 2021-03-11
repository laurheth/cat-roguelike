import Tile from './Tile';
import { default as Critter, CritterParams } from './Critter';
import FOV from './FOV';
import Game, { StatusNumber } from './Game';
import { Random } from 'roguelike-pumpkin-patch';

interface PlayerParams  {
    fov:FOV;
    startTile:Tile;
    statusUpdate:(fear:StatusNumber,hunger:StatusNumber,sharpness:StatusNumber,item:string|undefined)=>void;
    rng:Random;
    game:Game;
}

/** The player */
export default class Player extends Critter {
    readonly fov:FOV;
    private fear:number;
    private hunger:number;
    private sharpness:number;
    private maxFear:number;
    private maxHunger:number;
    private maxSharpness:number;
    private statusUpdate:(fear:StatusNumber,hunger:StatusNumber,sharpness:StatusNumber,item:string|undefined)=>void;
    private rng:Random;
    private game:Game;
    private xp:number;
    private turnCount:number;
    constructor(params:PlayerParams) {
        const { fov, startTile, statusUpdate, rng, game, ...rest } = params;
        super({
            startTile:startTile,
            appearance:{
                content:'<img src="./assets/cat.png" alt="A very good cat.">',
                classList:['player']
            }
        });

        this.fov = fov;
        this.statusUpdate = statusUpdate;
        this.rng = rng;
        this.game = game;
        this.fear = 0;
        this.hunger = 0;
        this.sharpness = 5;
        this.maxFear = 10;
        this.maxHunger = 10;
        this.maxSharpness = 10;
        this.xp = 0;
        this.turnCount=0;
    }

    /** Reset stats */
    resetStats() {
        this.fear = 0;
        this.hunger = 0;
        this.sharpness = 5;
        this.maxFear = 10;
        this.maxHunger = 10;
        this.maxSharpness = 10;
        this.xp = 0;
        this.turnCount = 0;
    }

    /** Gain XP */
    gainXP(xp:number) {
        let possibleGains = false;
        if (xp > 0) {
            for(let i=0;i<xp;i++) {
                if (this.xp % 10 !== 0) {
                    possibleGains = true;
                } else {
                    possibleGains = false;
                }
                this.xp++;
                this.fear = Math.max(0, this.fear - 1);
                if (this.xp % 10 === 0 && possibleGains) {
                    this.maxFear++;
                    this.maxSharpness++;
                    this.sharpness++;
                }
            }
        }
    }

    /** Act */
    act() {
        // Update view
        this.fov.look(this.currentTile);
        // Update status
        this.updateStatus();
        this.turnCount++;
        this.honger();
        return new Promise(resolve => {
            const eventHandler = (event:KeyboardEvent)=>{
                const eventResult = this.handleEvent(event);
                if(eventResult) {
                    document.removeEventListener('keydown',eventHandler);
                    if (eventResult instanceof Critter) {
                        this.gainXP(eventResult.attackMe(this.calcDmg()));
                        this.dullClaws();
                    }
                    resolve(true);
                }
            }
            document.addEventListener('keydown',eventHandler);
        });
    }

    /** Advance honger */
    honger() {
        if(this.turnCount % 50 === 0) {
            this.hunger++;
        }
        if (this.hunger >= this.maxHunger) {
            this.die();
        }
    }

    /** Update status */
    updateStatus() {
        this.statusUpdate({
            min:this.fear,
            max:this.maxFear,
            class:(this.fear / this.maxFear > 0.8) ? "panic" : ""
        },{
            min:this.hunger,
            max:this.maxHunger,
            class:(this.hunger / this.maxHunger > 0.8) ? "panic" : ""
        },{
            min:this.sharpness,
            max:this.maxSharpness,
            class:(this.sharpness / this.maxSharpness > 0.8) ? "party" : ""
        },undefined);
    }

    /** Calculate damage */
    calcDmg() {
        const min = Math.min(1,this.sharpness / 2);
        const max = Math.max(2, 1.5 * this.sharpness);
        return this.rng.getNumber(min,max);
    }

    dullClaws() {
        if (this.sharpness > this.maxSharpness) {
            this.sharpness--;
        } else if (this.sharpness > 1) {
            for(let i=(this.maxSharpness - this.sharpness); i<this.maxSharpness;i++) {
                if(this.rng.getRandom() > 0.96) {
                    this.sharpness--;
                    break;
                }
            }
        }
    }

    attackMe(damage:number) {
        this.fear += damage;
        if (this.fear >= this.maxFear) {
            this.die();
        }
        return 0;
    }

    public die() {
        this.fov.look(this.currentTile);
        this.updateStatus();
        this.game.stop();
    }

    /** Event handler */
    handleEvent(event:KeyboardEvent) {
        let acted:boolean|Critter = false;
        switch(event.key) {
            case 'Right':
            case 'ArrowRight':
                acted = this.step(1,0);
                break;
            case 'Left':
            case 'ArrowLeft':
                acted = this.step(-1,0);
                break;
            case 'Up':
            case 'ArrowUp':
                acted = this.step(0,-1);
                break;
            case 'Down':
            case 'ArrowDown':
                acted = this.step(0,1);
                break;
            case 'Period':
            case '.':
                acted=true;
                break;
        }
        return acted;
    }
}